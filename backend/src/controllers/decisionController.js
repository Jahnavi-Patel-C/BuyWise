import PurchaseDecision from '../models/PurchaseDecision.js';
import FinancialProfile from '../models/FinancialProfile.js';
import FinancialObligation from '../models/FinancialObligation.js';
import Transaction from '../models/Transaction.js';
import { evaluatePurchaseDecision } from '../services/decisionEngine.js';
import { evaluateDailySpend } from '../services/dailyEvaluator.js';
import { checkAndRolloverSavingsCycle } from '../services/cycleManager.js';

export async function evaluatePurchase(req, res, next) {
  try {
    const {
      purchaseName,
      amount,
      category = 'Shopping',
      plannedDate = new Date(),
      priority = 'useful',
      description = '',
      saveHistory = true,
    } = req.body;

    if (!purchaseName || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Purchase name and amount are required',
      });
    }

    const profile = await FinancialProfile.findOne({ userId: req.user.id });
    if (profile) {
      const { rolledOver } = checkAndRolloverSavingsCycle(profile);
      if (rolledOver) await profile.save();
    }
    const obligations = await FinancialObligation.find({ userId: req.user.id });
    const recentTransactions = await Transaction.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(30);

    const evaluation = evaluatePurchaseDecision({
      purchaseName,
      amount,
      category,
      plannedDate,
      priority,
      profile,
      obligations,
      recentTransactions,
    });

    let savedDecision = null;
    if (saveHistory !== false) {
      savedDecision = await PurchaseDecision.create({
        userId: req.user.id,
        purchaseName: purchaseName.trim(),
        amount: Number(amount),
        category,
        plannedDate: new Date(plannedDate),
        priority,
        description,
        recommendation: evaluation.recommendation,
        calculatedFinancialCapacity: evaluation.calculatedFinancialCapacity,
        remainingProjectedBalance: evaluation.remainingProjectedBalance,
        discretionaryCapacity: evaluation.discretionaryCapacity,
        safetyReserve: evaluation.safetyReserve,
        upcomingCommitmentsTotal: evaluation.upcomingCommitmentsTotal,
        reasons: evaluation.reasons,
        suggestedAction: evaluation.suggestedAction,
        alternativeSuggestions: evaluation.alternativeSuggestions,
        mlAssessment: evaluation.details,
      });
    }

    return res.status(200).json({
      success: true,
      decision: savedDecision || evaluation,
      evaluation,
    });
  } catch (error) {
    next(error);
  }
}

export async function evaluateDaily(req, res, next) {
  try {
    const { amount, category = 'Food', description = 'Daily expense' } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Daily spend amount is required',
      });
    }

    const profile = await FinancialProfile.findOne({ userId: req.user.id });
    if (profile) {
      const { rolledOver } = checkAndRolloverSavingsCycle(profile);
      if (rolledOver) await profile.save();
    }
    const obligations = await FinancialObligation.find({ userId: req.user.id });

    // Transactions today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const todayTransactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: startOfToday },
    });

    const monthTransactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: startOfMonth },
    });

    const result = evaluateDailySpend({
      amount,
      category,
      description,
      profile,
      todayTransactions,
      monthTransactions,
      obligations,
    });

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
}

export async function simulateWhatIf(req, res, next) {
  try {
    const {
      amount,
      purchaseName = 'Simulated Item',
      category = 'Shopping',
      plannedDate = new Date(),
      alternativeDiscountPct = 35,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid purchase amount is required for simulation',
      });
    }

    const purchaseAmount = Number(amount);
    const profile = await FinancialProfile.findOne({ userId: req.user.id });
    if (profile) {
      const { rolledOver } = checkAndRolloverSavingsCycle(profile);
      if (rolledOver) await profile.save();
    }
    const obligations = await FinancialObligation.find({ userId: req.user.id, status: 'pending' });

    const currentBalance = Number(profile?.currentBalance || 0);
    const expectedIncome = Number(profile?.expectedIncome || 0);
    const emergencyReserve = Number(profile?.emergencyReserve || 500);
    const savingsTarget = Number(profile?.savingsTarget || 0);
    const actualSavings = Number(profile?.actualSavings || 0);
    const remainingSavingsTarget = Math.max(0, savingsTarget - actualSavings);
    const totalProtectedReserves = emergencyReserve + remainingSavingsTarget;
    const essentialExpenses = Number(profile?.essentialExpenses || 0);

    const upcomingObligationsTotal = obligations.reduce((sum, o) => sum + o.amount, 0);

    // Baseline capacity:
    // Capacity = balance + expectedIncome - obligations - essential - remainingSavingsTarget - emergencyReserve
    const netFinancialCapacity = Math.max(
      0,
      currentBalance + expectedIncome - upcomingObligationsTotal - essentialExpenses - remainingSavingsTarget - emergencyReserve
    );

    const safeDiscretionarySpending = Math.max(0, currentBalance - totalProtectedReserves);

    // Scenario 1: Buy Now
    const buyNowRemaining = currentBalance - purchaseAmount;
    const buyNowProjectedWithIncome = currentBalance + expectedIncome - purchaseAmount - upcomingObligationsTotal;
    const buyNowAffordable = buyNowRemaining >= totalProtectedReserves;

    // Scenario 2: Wait until Next Allowance / Income
    const waitRemainingWithIncome = currentBalance + expectedIncome - upcomingObligationsTotal - purchaseAmount;
    const waitAffordable = waitRemainingWithIncome >= totalProtectedReserves;

    // Scenario 3: Cheaper Alternative
    const discountFactor = (100 - Number(alternativeDiscountPct || 35)) / 100;
    const cheaperPrice = Math.round(purchaseAmount * discountFactor);
    const cheaperImmediateRemaining = currentBalance - cheaperPrice;
    const cheaperSavings = purchaseAmount - cheaperPrice;
    const cheaperAffordable = cheaperImmediateRemaining >= totalProtectedReserves;

    // Scenario 4: Skip Purchase entirely
    const skipSavings = purchaseAmount;
    const skipYearlySavings = skipSavings * 12; // If recurring impulse habit

    return res.status(200).json({
      success: true,
      simulation: {
        input: {
          purchaseName,
          purchaseAmount,
          category,
          currentBalance,
          expectedIncome,
          upcomingObligationsTotal,
          emergencyReserve,
          savingsTarget,
          actualSavings,
          remainingSavingsTarget,
          totalProtectedReserves,
          safeDiscretionarySpending,
          netFinancialCapacity,
        },
        scenarios: {
          buyNow: {
            title: 'Buy Now (Immediate)',
            cost: purchaseAmount,
            immediateBalance: buyNowRemaining,
            projectedBalanceWithCycle: buyNowProjectedWithIncome,
            isViable: buyNowAffordable,
            riskLevel: buyNowRemaining < emergencyReserve ? 'High Risk' : buyNowRemaining < totalProtectedReserves ? 'Moderate Risk' : 'Low Risk',
            summary: buyNowRemaining < emergencyReserve
              ? `Violates emergency reserve by ₹${Math.abs(buyNowRemaining - emergencyReserve).toLocaleString('en-IN')}`
              : buyNowRemaining < totalProtectedReserves
              ? `Preserves emergency reserve, but encroaches on remaining savings target by ₹${(totalProtectedReserves - buyNowRemaining).toLocaleString('en-IN')}`
              : `Safe! Leaves ₹${buyNowRemaining.toLocaleString('en-IN')}, fully preserving emergency reserve and savings target`,
          },
          waitNextAllowance: {
            title: 'Wait for Next Allowance',
            cost: purchaseAmount,
            projectedBalance: waitRemainingWithIncome,
            isViable: waitAffordable,
            riskLevel: waitAffordable ? 'Safe' : 'Moderate',
            summary: waitAffordable
              ? `Waiting allows your allowance (₹${expectedIncome.toLocaleString('en-IN')}) to replenish your cash while protecting savings & reserves`
              : `Even with allowance, buffer is tight due to upcoming fees`,
          },
          cheaperAlternative: {
            title: `Cheaper Alternative (~${alternativeDiscountPct}% less)`,
            cost: cheaperPrice,
            immediateBalance: cheaperImmediateRemaining,
            savedAmount: cheaperSavings,
            isViable: cheaperAffordable,
            summary: `Saves ₹${cheaperSavings.toLocaleString('en-IN')} instantly while serving the core purpose`,
          },
          skipPurchase: {
            title: 'Skip Purchase & Boost Savings',
            cost: 0,
            immediateBalance: currentBalance,
            instantSavings: skipSavings,
            projectedAnnualImpact: skipYearlySavings,
            summary: `Retains full ₹${skipSavings.toLocaleString('en-IN')}. Redirecting to savings accelerates your target by ${(skipSavings / (savingsTarget || 500)).toFixed(1)}x months`,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDecisionHistory(req, res, next) {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const total = await PurchaseDecision.countDocuments({ userId: req.user.id });
    const decisions = await PurchaseDecision.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      decisions,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDecision(req, res, next) {
  try {
    const decision = await PurchaseDecision.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!decision) {
      return res.status(404).json({
        success: false,
        message: 'Decision not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Decision record removed',
    });
  } catch (error) {
    next(error);
  }
}

