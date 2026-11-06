import FinancialObligation from '../models/FinancialObligation.js';

export async function getObligations(req, res, next) {
  try {
    const { status } = req.query;
    const query = { userId: req.user.id };

    if (status && ['pending', 'paid'].includes(status)) {
      query.status = status;
    }

    const obligations = await FinancialObligation.find(query).sort({ dueDate: 1 });

    const totalPending = obligations
      .filter((o) => o.status === 'pending')
      .reduce((sum, o) => sum + o.amount, 0);

    return res.status(200).json({
      success: true,
      obligations,
      summary: {
        totalPending,
        count: obligations.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createObligation(req, res, next) {
  try {
    const { title, amount, dueDate, obligationType, notes } = req.body;

    if (!title || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount and due date are required',
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    const obligation = await FinancialObligation.create({
      userId: req.user.id,
      title: title.trim(),
      amount: numericAmount,
      dueDate: new Date(dueDate),
      obligationType: obligationType || 'college_fee',
      notes: notes || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Financial obligation added successfully',
      obligation,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateObligation(req, res, next) {
  try {
    const { title, amount, dueDate, obligationType, status, notes } = req.body;

    const obligation = await FinancialObligation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!obligation) {
      return res.status(404).json({
        success: false,
        message: 'Financial obligation not found or unauthorized',
      });
    }

    if (title) obligation.title = title.trim();
    if (amount !== undefined) obligation.amount = Number(amount);
    if (dueDate) obligation.dueDate = new Date(dueDate);
    if (obligationType) obligation.obligationType = obligationType;
    if (status) obligation.status = status;
    if (notes !== undefined) obligation.notes = notes;

    await obligation.save();

    return res.status(200).json({
      success: true,
      message: 'Financial obligation updated',
      obligation,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteObligation(req, res, next) {
  try {
    const obligation = await FinancialObligation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!obligation) {
      return res.status(404).json({
        success: false,
        message: 'Financial obligation not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Financial obligation deleted',
    });
  } catch (error) {
    next(error);
  }
}

