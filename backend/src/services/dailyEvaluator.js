/**
 * BuyWise Daily Spending Evaluator (Module 2)
 * Answers everyday questions like: "Can I spend ₹250 on food today?"
 * Evaluates short-term velocity, today's accumulated spend, and daily safe allowance
 * while strictly respecting emergency reserves AND remaining monthly savings targets.
 */

export function evaluateDailySpend({
  amount,
  category = 'Food',
  description = 'Daily expense',
  profile,
  todayTransactions = [],
  monthTransactions = [],
  obligations = [],
}) {
  const spendAmount = Number(amount);
  if (isNaN(spendAmount) || spendAmount <= 0) {
    throw new Error('Daily spend amount must be greater than 0');
  }

  const currentBalance = Number(profile?.currentBalance || 0);
  const emergencyReserve = Number(profile?.emergencyReserve || 500);
  const allowance = Number(profile?.allowance || 0);
  const essentialExpenses = Number(profile?.essentialExpenses || 0);
  const savingsTarget = Number(profile?.savingsTarget || 0);
  const actualSavings = Number(profile?.actualSavings || 0);

  // Remaining savings target for the current monthly cycle
  const remainingSavingsTarget = Math.max(0, savingsTarget - actualSavings);

  // Total protected reserves from current balance
  const totalProtectedReserves = emergencyReserve + remainingSavingsTarget;

  // Calculate days remaining in the current month (or cycle)
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - currentDay + 1);

  // Sum today's existing expenses
  const spentToday = todayTransactions
    .filter((t) => t.type === 'expense' && t.category !== 'Savings')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Total spent this month (excluding dedicated savings contributions)
  const spentThisMonth = monthTransactions
    .filter((t) => t.type === 'expense' && t.category !== 'Savings')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Remaining liquid discretionary funds from balance (protecting both emergency reserve & remaining savings target)
  const liquidDiscretionary = Math.max(0, currentBalance - totalProtectedReserves);

  // Monthly discretionary budget = allowance - essential - remaining savings
  // If allowance is not configured, fall back to current liquid discretionary funds
  const monthlyDiscretionaryBudget = allowance > 0
    ? Math.max(0, allowance - essentialExpenses - remainingSavingsTarget)
    : liquidDiscretionary;
  
  const remainingBudget = Math.min(
    liquidDiscretionary,
    monthlyDiscretionaryBudget > 0 ? Math.max(0, monthlyDiscretionaryBudget - spentThisMonth) : liquidDiscretionary
  );

  // Daily safe allowance = remaining budget / remaining days
  const dailySafeAllowance = Math.max(50, Math.round(remainingBudget / remainingDays));

  // Today's total with this proposed spend
  const projectedTodaySpend = spentToday + spendAmount;

  // Remaining balance after this spend
  const balanceAfterSpend = currentBalance - spendAmount;

  // Upcoming obligations in next 7 days
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const nearObligations = obligations.filter((ob) => {
    if (ob.status === 'paid') return false;
    const due = new Date(ob.dueDate);
    return due >= now && due <= sevenDaysFromNow;
  });
  const nearObligationsTotal = nearObligations.reduce((sum, ob) => sum + Number(ob.amount || 0), 0);

  let recommendation = 'BUY NOW';
  const reasons = [];
  let suggestedAction = '';

  // Critical check 1: Negative balance or below emergency reserve
  if (balanceAfterSpend < emergencyReserve) {
    recommendation = 'RECONSIDER';
    reasons.push(
      `Spending ₹${spendAmount} leaves your balance at ₹${balanceAfterSpend.toLocaleString('en-IN')}, dipping into your untouchable ₹${emergencyReserve.toLocaleString('en-IN')} emergency reserve.`
    );
    suggestedAction = `Avoid this expense to protect your minimum emergency safety cushion.`;
  }
  // Check 2: Encroaches upon remaining savings target
  else if (balanceAfterSpend < totalProtectedReserves) {
    const encroachment = totalProtectedReserves - balanceAfterSpend;
    recommendation = 'WAIT';
    reasons.push(
      `Spending ₹${spendAmount} leaves your balance at ₹${balanceAfterSpend.toLocaleString('en-IN')}. While your ₹${emergencyReserve.toLocaleString('en-IN')} emergency reserve is intact, this encroaches upon your remaining monthly savings target of ₹${remainingSavingsTarget.toLocaleString('en-IN')} by ₹${encroachment.toLocaleString('en-IN')}.`
    );
    reasons.push(
      `You have saved ₹${actualSavings.toLocaleString('en-IN')} towards your ₹${savingsTarget.toLocaleString('en-IN')} monthly target.`
    );
    suggestedAction = `Hold off or choose a cheaper alternative to keep your savings commitment intact.`;
  }
  // Check 3: Upcoming bill in next 7 days that would be jeopardized
  else if (balanceAfterSpend < (totalProtectedReserves + nearObligationsTotal)) {
    recommendation = 'WAIT';
    reasons.push(
      `You have upcoming obligations of ₹${nearObligationsTotal.toLocaleString('en-IN')} due within 7 days.`
    );
    reasons.push(
      `While you have enough cash for your reserve and savings, this purchase tightens your cash flow right before your bills are cleared.`
    );
    suggestedAction = `Check if this daily expense can be deferred or trimmed until your weekly obligations clear.`;
  }
  // Check 4: Exceeding daily safe spending pace significantly (e.g. > 1.8x daily safe limit)
  else if (projectedTodaySpend > dailySafeAllowance * 1.8 && spendAmount > dailySafeAllowance) {
    recommendation = 'WAIT';
    reasons.push(
      `Your recommended safe daily spending limit is ₹${dailySafeAllowance}/day for the remaining ${remainingDays} days this month (after reserving your emergency cushion and remaining savings goal).`
    );
    reasons.push(
      `You already spent ₹${spentToday} today. Adding ₹${spendAmount} brings today's total to ₹${projectedTodaySpend}, which significantly exceeds your daily pace.`
    );
    suggestedAction = `Consider capping today's spend to ₹${Math.max(0, dailySafeAllowance - spentToday)} or choosing a lighter option.`;
  }
  // Check 5: Slightly over daily limit, but comfortable overall
  else if (projectedTodaySpend > dailySafeAllowance) {
    recommendation = 'BUY NOW';
    reasons.push(
      `Proposed spend of ₹${spendAmount} is slightly higher than your daily target (₹${dailySafeAllowance}/day), but your balance of ₹${currentBalance.toLocaleString('en-IN')} has enough cushion to absorb it.`
    );
    reasons.push(
      `Both your ₹${emergencyReserve.toLocaleString('en-IN')} emergency reserve and remaining ₹${remainingSavingsTarget.toLocaleString('en-IN')} savings commitment are preserved.`
    );
    suggestedAction = `Approved! Aim to keep tomorrow's discretionary spend modest.`;
  }
  // Check 6: Comfortably within daily budget
  else {
    recommendation = 'BUY NOW';
    reasons.push(
      `₹${spendAmount} is well within your safe daily allowance of ₹${dailySafeAllowance}/day.`
    );
    reasons.push(
      `Even after spending ₹${spendAmount}, you retain ₹${balanceAfterSpend.toLocaleString('en-IN')}, safely preserving both your emergency cushion (₹${emergencyReserve.toLocaleString('en-IN')}) and remaining savings target (₹${remainingSavingsTarget.toLocaleString('en-IN')}).`
    );
    suggestedAction = `Safe to spend. Enjoy responsibly!`;
  }

  return {
    recommendation,
    spendAmount,
    category,
    description,
    spentToday,
    projectedTodaySpend,
    dailySafeAllowance,
    remainingDaysInMonth: remainingDays,
    balanceAfterSpend,
    currentBalance,
    emergencyReserve,
    savingsTarget,
    actualSavings,
    remainingSavingsTarget,
    totalProtectedReserves,
    safeDiscretionarySpending: liquidDiscretionary,
    nearObligationsTotal,
    reasons,
    suggestedAction,
  };
}
