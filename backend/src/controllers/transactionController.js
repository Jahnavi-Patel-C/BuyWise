import Transaction from '../models/Transaction.js';
import FinancialProfile from '../models/FinancialProfile.js';
import { predictCategory, detectAnomalies } from '../services/mlClient.js';

export async function getTransactions(req, res, next) {
  try {
    const { category, type, limit = 50, page = 1 } = req.query;
    const query = { userId: req.user.id };

    if (category && category !== 'All') {
      query.category = category;
    }
    if (type && type !== 'all') {
      query.type = type;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      transactions,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createTransaction(req, res, next) {
  try {
    const { description, amount, type = 'expense', category, date, paymentMethod } = req.body;

    if (!description || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Description and amount are required',
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    // Determine category: if not explicitly supplied or 'Other', use ML categorizer
    let finalCategory = category;
    let mlDetails = null;
    if (!finalCategory || finalCategory === 'Other' || finalCategory === 'auto') {
      const prediction = await predictCategory(description);
      finalCategory = prediction.category;
      mlDetails = prediction;
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      description: description.trim(),
      amount: numericAmount,
      type,
      category: finalCategory,
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'UPI',
    });

    // Update user profile current balance
    const balanceDelta = type === 'income' ? numericAmount : -numericAmount;
    const profileUpdate = { $inc: { currentBalance: balanceDelta } };

    // If transaction is tagged as Savings contribution, increment actual savings and lifetime accumulated savings
    if (finalCategory === 'Savings' && type === 'expense') {
      profileUpdate.$inc.actualSavings = numericAmount;
      profileUpdate.$inc.totalAccumulatedSavings = numericAmount;
    }

    await FinancialProfile.findOneAndUpdate(
      { userId: req.user.id },
      profileUpdate,
      { upsert: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      transaction,
      mlCategorization: mlDetails,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTransaction(req, res, next) {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id, // Strictly isolate
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or access denied',
      });
    }

    // Revert balance adjustment
    const revertDelta = transaction.type === 'income' ? -transaction.amount : transaction.amount;
    const revertUpdate = { $inc: { currentBalance: revertDelta } };

    if (transaction.category === 'Savings' && transaction.type === 'expense') {
      revertUpdate.$inc.actualSavings = -transaction.amount;
      revertUpdate.$inc.totalAccumulatedSavings = -transaction.amount;
    }

    await FinancialProfile.findOneAndUpdate(
      { userId: req.user.id },
      revertUpdate
    );

    await Transaction.deleteOne({ _id: transaction._id });

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted and balance adjusted',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTransaction(req, res, next) {
  try {
    const { description, amount, type, category, date, paymentMethod } = req.body;
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or access denied',
      });
    }

    const oldAmount = transaction.amount;
    const oldType = transaction.type;
    const oldCategory = transaction.category;

    const newAmount = amount !== undefined ? Number(amount) : oldAmount;
    const newType = type || oldType;
    const newCategory = category || oldCategory;

    if (isNaN(newAmount) || newAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    // Revert old effect on currentBalance and apply new effect
    const oldBalanceImpact = oldType === 'income' ? oldAmount : -oldAmount;
    const newBalanceImpact = newType === 'income' ? newAmount : -newAmount;
    const netBalanceDelta = newBalanceImpact - oldBalanceImpact;

    // Savings delta
    let netSavingsDelta = 0;
    if (oldCategory === 'Savings' && oldType === 'expense') {
      netSavingsDelta -= oldAmount;
    }
    if (newCategory === 'Savings' && newType === 'expense') {
      netSavingsDelta += newAmount;
    }

    const profileUpdate = {};
    if (netBalanceDelta !== 0) {
      profileUpdate.$inc = profileUpdate.$inc || {};
      profileUpdate.$inc.currentBalance = netBalanceDelta;
    }
    if (netSavingsDelta !== 0) {
      profileUpdate.$inc = profileUpdate.$inc || {};
      profileUpdate.$inc.actualSavings = netSavingsDelta;
      profileUpdate.$inc.totalAccumulatedSavings = netSavingsDelta;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await FinancialProfile.findOneAndUpdate(
        { userId: req.user.id },
        profileUpdate
      );
    }

    if (description !== undefined) transaction.description = description.trim();
    transaction.amount = newAmount;
    transaction.type = newType;
    transaction.category = newCategory;
    if (date !== undefined) transaction.date = new Date(date);
    if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction,
    });
  } catch (error) {
    next(error);
  }
}

export async function autoCategorize(req, res, next) {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    const result = await predictCategory(description);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

