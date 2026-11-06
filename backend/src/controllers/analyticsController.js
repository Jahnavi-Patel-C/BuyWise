import Transaction from '../models/Transaction.js';
import FinancialProfile from '../models/FinancialProfile.js';
import FinancialObligation from '../models/FinancialObligation.js';
import { detectAnomalies, forecastExpenses } from '../services/mlClient.js';
import { checkAndRolloverSavingsCycle } from '../services/cycleManager.js';

export async function getSpendingIntelligence(req, res, next) {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: 1 });
    const profile = await FinancialProfile.findOne({ userId: req.user.id });
    if (profile) {
      const { rolledOver } = checkAndRolloverSavingsCycle(profile);
      if (rolledOver) await profile.save();
    }

    if (!transactions || transactions.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          totalSpent: 0,
          totalIncome: 0,
          transactionCount: 0,
        },
        categoryBreakdown: [],
        microExpenses: [],
        recurringExpenses: [],
        anomalies: [],
        forecast: null,
        message: 'No transactions recorded yet. Add transactions or load demo data to view intelligence.',
      });
    }

    const expenses = transactions.filter((t) => t.type === 'expense');
    const totalSpent = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // 1. Category Breakdown
    const catMap = {};
    expenses.forEach((t) => {
      const cat = t.category || 'Other';
      if (!catMap[cat]) catMap[cat] = { total: 0, count: 0 };
      catMap[cat].total += Number(t.amount);
      catMap[cat].count += 1;
    });

    const categoryBreakdown = Object.entries(catMap)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        percentage: totalSpent > 0 ? Math.round((data.total / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // 2. Identify Repeated Small Purchases (Micro-transactions <= ₹300)
    const microMap = {};
    expenses.forEach((t) => {
      if (t.amount <= 300) {
        // Group by normalized keyword or category
        const key = t.category;
        if (!microMap[key]) microMap[key] = { count: 0, total: 0, examples: [] };
        microMap[key].count += 1;
        microMap[key].total += t.amount;
        if (microMap[key].examples.length < 3 && !microMap[key].examples.includes(t.description)) {
          microMap[key].examples.push(t.description);
        }
      }
    });

    const microExpenses = Object.entries(microMap)
      .filter(([_, data]) => data.count >= 3)
      .map(([category, data]) => {
        const potential20PctSavings = Math.round(data.total * 0.2);
        return {
          category,
          count: data.count,
          total: data.total,
          potentialMonthlySavings: potential20PctSavings,
          insight: `You made ${data.count} small ${category.toLowerCase()} purchases totaling ₹${data.total.toLocaleString('en-IN')}. Cutting back by 20% would save ₹${potential20PctSavings.toLocaleString('en-IN')} each month.`,
          examples: data.examples,
        };
      })
      .sort((a, b) => b.total - a.total);

    // 3. Detect Recurring Expenses (similar descriptions appearing across time)
    const descMap = {};
    expenses.forEach((t) => {
      const descKey = t.description.toLowerCase().trim();
      if (!descMap[descKey]) descMap[descKey] = { count: 0, total: 0, category: t.category };
      descMap[descKey].count += 1;
      descMap[descKey].total += t.amount;
    });

    const recurringExpenses = Object.entries(descMap)
      .filter(([_, data]) => data.count >= 2)
      .map(([description, data]) => ({
        description,
        category: data.category,
        frequencyCount: data.count,
        totalSpent: data.total,
        averageAmount: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.frequencyCount - a.frequencyCount);

    // 4. ML / Statistical Anomaly Detection
    const anomalyResult = await detectAnomalies(transactions);

    // 5. ML / Statistical Expense Forecast
    const forecast = await forecastExpenses(transactions, 30);

    return res.status(200).json({
      success: true,
      summary: {
        totalSpent,
        totalIncome,
        transactionCount: transactions.length,
        averageExpense: expenses.length > 0 ? Math.round(totalSpent / expenses.length) : 0,
      },
      categoryBreakdown,
      microExpenses,
      recurringExpenses,
      anomalies: anomalyResult.anomalies || [],
      anomalyMethod: anomalyResult.method,
      forecast,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPersonalizedAdvice(req, res, next) {
  try {
    const profile = await FinancialProfile.findOne({ userId: req.user.id });
    if (profile) {
      const { rolledOver } = checkAndRolloverSavingsCycle(profile);
      if (rolledOver) await profile.save();
    }
    const obligations = await FinancialObligation.find({ userId: req.user.id, status: 'pending' }).sort({ dueDate: 1 });
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });

    const currentBalance = Number(profile?.currentBalance || 0);
    const emergencyReserve = Number(profile?.emergencyReserve || 500);
    const savingsTarget = Number(profile?.savingsTarget || 0);
    const allowance = Number(profile?.allowance || 0);
    const essentialExpenses = Number(profile?.essentialExpenses || 0);
    const expectedIncome = Number(profile?.expectedIncome || 0);

    const pendingObligationsTotal = obligations.reduce((sum, o) => sum + o.amount, 0);

    const recommendations = [];

    // Rule 1: Emergency Reserve health
    if (currentBalance < emergencyReserve) {
      recommendations.push({
        type: 'critical',
        title: 'Emergency Cushion Depleted',
        message: `Your current balance of ₹${currentBalance.toLocaleString('en-IN')} is below your safety threshold of ₹${emergencyReserve.toLocaleString('en-IN')}. Pause non-essential shopping until your next allowance.`,
        actionText: 'Review Emergency Target',
      });
    } else if (currentBalance < emergencyReserve * 1.5) {
      recommendations.push({
        type: 'warning',
        title: 'Tight Safety Margin',
        message: `You are within ₹${(currentBalance - emergencyReserve).toLocaleString('en-IN')} of your minimum emergency reserve. Avoid impulse buys above ₹500.`,
      });
    }

    // Rule 2: Impending high-priority obligations
    const nearObligations = obligations.filter((o) => {
      const diffDays = (new Date(o.dueDate) - new Date()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 14;
    });

    if (nearObligations.length > 0) {
      const nearest = nearObligations[0];
      const daysLeft = Math.max(0, Math.ceil((new Date(nearest.dueDate) - new Date()) / (1000 * 60 * 60 * 24)));
      recommendations.push({
        type: nearObligations.some(o => o.amount > currentBalance) ? 'critical' : 'warning',
        title: `Upcoming Commitment: ${nearest.title}`,
        message: `₹${nearest.amount.toLocaleString('en-IN')} is due in ${daysLeft} days. Ensure you keep at least this amount reserved in your account.`,
      });
    }

    // Rule 3: Category concentration (Food or Shopping taking > 40% of expenses)
    const expenses = transactions.filter((t) => t.type === 'expense');
    const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
    if (totalSpent > 0) {
      const foodSpend = expenses.filter((t) => t.category === 'Food').reduce((s, t) => s + t.amount, 0);
      const foodPct = Math.round((foodSpend / totalSpent) * 100);
      if (foodPct > 35) {
        recommendations.push({
          type: 'info',
          title: 'High Dining & Food Velocity',
          message: `Food accounts for ${foodPct}% (₹${foodSpend.toLocaleString('en-IN')}) of your total spending. Cooking or opting for canteen meals twice a week could redirect ₹600/month towards your savings.`,
        });
      }

      const shoppingSpend = expenses.filter((t) => t.category === 'Shopping').reduce((s, t) => s + t.amount, 0);
      const shoppingPct = Math.round((shoppingSpend / totalSpent) * 100);
      if (shoppingPct > 30) {
        recommendations.push({
          type: 'info',
          title: 'Shopping Surge Detected',
          message: `Shopping represents ${shoppingPct}% of your expenses. Use the BuyWise Purchase Analyzer before any new gadget or apparel checkout.`,
        });
      }
    }

    // Rule 4: Savings goal pacing & actual contributions
    const actualSavings = Number(profile?.actualSavings || 0);
    const remainingSavingsTarget = Math.max(0, savingsTarget - actualSavings);
    const totalProtectedReserves = emergencyReserve + remainingSavingsTarget;
    const discretionarySurplus = currentBalance + expectedIncome - pendingObligationsTotal - essentialExpenses - totalProtectedReserves;

    if (savingsTarget > 0) {
      if (actualSavings >= savingsTarget) {
        recommendations.push({
          type: 'success',
          title: 'Monthly Savings Target Achieved! 🎯',
          message: `You have successfully saved ₹${actualSavings.toLocaleString('en-IN')} towards your ₹${savingsTarget.toLocaleString('en-IN')} goal this cycle. Your full remaining balance is free for discretionary spending above your emergency cushion.`,
        });
      } else if (actualSavings > 0) {
        recommendations.push({
          type: 'info',
          title: `Savings In Progress (${Math.round((actualSavings / savingsTarget) * 100)}%)`,
          message: `₹${actualSavings.toLocaleString('en-IN')} saved so far out of ₹${savingsTarget.toLocaleString('en-IN')}. ₹${remainingSavingsTarget.toLocaleString('en-IN')} remains to be set aside from this cycle's funds.`,
        });
      } else {
        recommendations.push({
          type: 'info',
          title: 'Monthly Savings Target Pending',
          message: `Your ₹${savingsTarget.toLocaleString('en-IN')} savings goal is currently reserved from your liquid balance, leaving ₹${Math.max(0, currentBalance - totalProtectedReserves).toLocaleString('en-IN')} as safe discretionary spending.`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      recommendations,
      profileContext: {
        currentBalance,
        emergencyReserve,
        savingsTarget,
        actualSavings,
        remainingSavingsTarget,
        totalProtectedReserves,
        safeDiscretionarySpending: Math.max(0, currentBalance - totalProtectedReserves),
        pendingObligationsTotal,
        discretionarySurplus,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getFinancialTimeline(req, res, next) {
  try {
    const profile = await FinancialProfile.findOne({ userId: req.user.id });
    if (profile) {
      const { rolledOver } = checkAndRolloverSavingsCycle(profile);
      if (rolledOver) await profile.save();
    }
    const obligations = await FinancialObligation.find({ userId: req.user.id, status: 'pending' }).sort({ dueDate: 1 });

    const currentBalance = Number(profile?.currentBalance || 0);
    const expectedIncome = Number(profile?.expectedIncome || 0);
    const expectedIncomeDate = profile?.expectedIncomeDate ? new Date(profile.expectedIncomeDate) : null;
    const emergencyReserve = Number(profile?.emergencyReserve || 500);
    const savingsTarget = Number(profile?.savingsTarget || 0);
    const actualSavings = Number(profile?.actualSavings || 0);
    const remainingSavingsTarget = Math.max(0, savingsTarget - actualSavings);
    const totalProtectedReserves = emergencyReserve + remainingSavingsTarget;

    const events = [];

    // 1. Initial State Milestone
    events.push({
      id: 'current-balance',
      type: 'initial',
      title: 'Current Available Balance',
      amount: currentBalance,
      date: new Date(),
      isIncome: true,
      description: 'Your verified starting liquid balance',
    });

    // 2. Pending Obligations
    obligations.forEach((o) => {
      events.push({
        id: o._id.toString(),
        type: 'obligation',
        title: o.title,
        amount: o.amount,
        date: new Date(o.dueDate),
        isIncome: false,
        category: o.obligationType,
        description: `Scheduled obligation (${o.obligationType.replace('_', ' ')})`,
      });
    });

    // 3. Expected Income Milestone (if set)
    if (expectedIncome > 0 && expectedIncomeDate) {
      events.push({
        id: 'expected-income',
        type: 'income',
        title: 'Expected Allowance / Income',
        amount: expectedIncome,
        date: expectedIncomeDate,
        isIncome: true,
        description: `Scheduled incoming allowance/credit`,
      });
    }

    // Sort all milestones chronologically
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running projected balance chronologically without double-counting
    let runningBalance = currentBalance;
    const timelineWithBalances = events.map((event) => {
      if (event.type !== 'initial') {
        if (event.isIncome) {
          runningBalance += event.amount;
        } else {
          runningBalance -= event.amount;
        }
      }

      return {
        ...event,
        projectedBalance: runningBalance,
        isBelowReserve: runningBalance < emergencyReserve,
        isBelowSavingsTarget: runningBalance < totalProtectedReserves,
        isDeficit: runningBalance < 0,
      };
    });

    return res.status(200).json({
      success: true,
      currentBalance,
      emergencyReserve,
      savingsTarget,
      actualSavings,
      remainingSavingsTarget,
      totalProtectedReserves,
      safeDiscretionarySpending: Math.max(0, currentBalance - totalProtectedReserves),
      timeline: timelineWithBalances,
      finalProjectedBalance: runningBalance,
    });
  } catch (error) {
    next(error);
  }
}

