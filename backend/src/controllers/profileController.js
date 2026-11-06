import FinancialProfile from '../models/FinancialProfile.js';
import FinancialObligation from '../models/FinancialObligation.js';
import Transaction from '../models/Transaction.js';
import { checkAndRolloverSavingsCycle } from '../services/cycleManager.js';

export async function getProfile(req, res, next) {
  try {
    let profile = await FinancialProfile.findOne({ userId: req.user.id });
    if (!profile) {
      // Create a default initial profile for the student
      profile = await FinancialProfile.create({
        userId: req.user.id,
        allowance: 5000,
        allowanceFrequency: 'monthly',
        currentBalance: 3000,
        expectedIncome: 5000,
        expectedIncomeDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        essentialExpenses: 1500,
        savingsTarget: 1000,
        emergencyReserve: 500,
      });
    }

    // Check if savings cycle has rolled over to a new month/cycle
    const { rolledOver } = checkAndRolloverSavingsCycle(profile);
    if (rolledOver) {
      await profile.save();
    }

    // Also get summary of pending obligations and current monthly expense for quick context
    const pendingObligations = await FinancialObligation.find({
      userId: req.user.id,
      status: 'pending',
    }).sort({ dueDate: 1 });

    const totalPendingObligations = pendingObligations.reduce((sum, o) => sum + o.amount, 0);

    const savingsTarget = Number(profile.savingsTarget || 0);
    const actualSavings = Number(profile.actualSavings || 0);
    const totalAccumulatedSavings = Number(profile.totalAccumulatedSavings || 0);
    const remainingSavingsTarget = Math.max(0, savingsTarget - actualSavings);
    const emergencyReserve = Number(profile.emergencyReserve || 500);
    const currentBalance = Number(profile.currentBalance || 0);
    const totalProtectedReserves = emergencyReserve + remainingSavingsTarget;
    const safeDiscretionary = Math.max(0, currentBalance - totalProtectedReserves);

    return res.status(200).json({
      success: true,
      profile,
      summary: {
        totalPendingObligations,
        pendingObligationsCount: pendingObligations.length,
        emergencyReserve,
        savingsTarget,
        actualSavings,
        totalAccumulatedSavings,
        remainingSavingsTarget,
        totalProtectedReserves,
        safeDiscretionary,
        currentCycleStart: profile.currentCycleStart,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const {
      allowance,
      allowanceFrequency,
      currentBalance,
      expectedIncome,
      expectedIncomeDate,
      essentialExpenses,
      savingsTarget,
      actualSavings,
      totalAccumulatedSavings,
      emergencyReserve,
    } = req.body;

    const updateData = {};
    if (allowance !== undefined) updateData.allowance = Math.max(0, Number(allowance));
    if (allowanceFrequency) updateData.allowanceFrequency = allowanceFrequency;
    if (currentBalance !== undefined) updateData.currentBalance = Math.max(0, Number(currentBalance));
    if (expectedIncome !== undefined) updateData.expectedIncome = Math.max(0, Number(expectedIncome));
    if (expectedIncomeDate !== undefined) updateData.expectedIncomeDate = expectedIncomeDate;
    if (essentialExpenses !== undefined) updateData.essentialExpenses = Math.max(0, Number(essentialExpenses));
    if (savingsTarget !== undefined) updateData.savingsTarget = Math.max(0, Number(savingsTarget));
    if (actualSavings !== undefined) updateData.actualSavings = Math.max(0, Number(actualSavings));
    if (totalAccumulatedSavings !== undefined) updateData.totalAccumulatedSavings = Math.max(0, Number(totalAccumulatedSavings));
    if (emergencyReserve !== undefined) updateData.emergencyReserve = Math.max(0, Number(emergencyReserve));

    const profile = await FinancialProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Financial profile updated successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
}

