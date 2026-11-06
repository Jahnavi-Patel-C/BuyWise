/**
 * BuyWise Deterministic Financial Decision Engine
 * Transparent, explainable, student-centered financial evaluation.
 * Accurately distinguishes between:
 * 1. Emergency Reserve (untouchable money)
 * 2. Monthly Savings Target (planned savings for the cycle)
 * 3. Actual Savings (money already saved/contributed)
 * 4. Remaining Savings Target (target minus actual savings)
 */

export function evaluatePurchaseDecision({
  purchaseName,
  amount,
  category = 'Shopping',
  plannedDate = new Date(),
  priority = 'useful', // 'essential', 'useful', 'optional'
  profile,
  obligations = [],
  recentTransactions = [],
}) {
  const purchaseAmount = Number(amount);
  if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
    throw new Error('Purchase amount must be a positive number greater than 0');
  }

  const currentBalance = Number(profile?.currentBalance || 0);
  const emergencyReserve = Number(profile?.emergencyReserve || 500);
  const savingsTarget = Number(profile?.savingsTarget || 0);
  const actualSavings = Number(profile?.actualSavings || 0);
  const expectedIncome = Number(profile?.expectedIncome || 0);
  const allowance = Number(profile?.allowance || 0);
  const allowanceFrequency = profile?.allowanceFrequency || 'monthly';
  const essentialExpenses = Number(profile?.essentialExpenses || 0);

  // Dynamic remaining savings target for current cycle
  const remainingSavingsTarget = Math.max(0, savingsTarget - actualSavings);

  // Total protected reserves to keep safe from current balance:
  // Emergency Reserve (untouchable) + Remaining Savings Target (not yet saved)
  const totalProtectedReserves = emergencyReserve + remainingSavingsTarget;

  // Safe liquid discretionary capacity right now:
  const safeDiscretionarySpending = Math.max(0, currentBalance - totalProtectedReserves);

  const purchaseDate = new Date(plannedDate);
  const now = new Date();

  // Normalize dates to midnight for fair comparison
  const targetDateMidnight = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), purchaseDate.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let expectedIncomeDate = profile?.expectedIncomeDate ? new Date(profile.expectedIncomeDate) : null;
  if (!expectedIncomeDate && expectedIncome > 0) {
    expectedIncomeDate = new Date();
    expectedIncomeDate.setDate(expectedIncomeDate.getDate() + 14);
  }

  const incomeArrivesBeforePurchase = expectedIncomeDate
    ? targetDateMidnight >= new Date(expectedIncomeDate.getFullYear(), expectedIncomeDate.getMonth(), expectedIncomeDate.getDate())
    : false;

  // Filter pending obligations in the evaluation window (30 days from now)
  const windowDays = 30;
  const horizonDate = new Date();
  horizonDate.setDate(horizonDate.getDate() + windowDays);

  const pendingObligations = obligations.filter((ob) => {
    if (ob.status === 'paid') return false;
    const due = new Date(ob.dueDate);
    return due <= horizonDate;
  });

  const upcomingCommitmentsTotal = pendingObligations.reduce((sum, ob) => sum + Number(ob.amount || 0), 0);

  // Critical College Fee or Rent check:
  const criticalObligations = pendingObligations.filter((ob) =>
    ['college_fee', 'rent', 'loan_or_emi'].includes(ob.obligationType)
  );
  const criticalObligationsTotal = criticalObligations.reduce((sum, ob) => sum + Number(ob.amount || 0), 0);

  // Remaining projected balance right after paying for the item:
  const remainingProjectedBalance = currentBalance - purchaseAmount;

  // Balance after paying for purchase AND all pending commitments (without future income):
  const immediateBufferAfterObligations = currentBalance - purchaseAmount - upcomingCommitmentsTotal;

  // Balance after purchase + all commitments + expected upcoming income:
  const projectedBufferWithIncome = currentBalance + expectedIncome - purchaseAmount - upcomingCommitmentsTotal - essentialExpenses;

  // Full cycle discretionary capacity before this purchase:
  const totalLockedCommitments = upcomingCommitmentsTotal + essentialExpenses + emergencyReserve + remainingSavingsTarget;
  const discretionaryCapacity = Math.max(0, currentBalance + expectedIncome - totalLockedCommitments);

  // Determine Recommendation and build explanation
  let recommendation = 'RECONSIDER';
  const reasons = [];
  let suggestedAction = '';
  const alternativeSuggestions = [];

  // Case A: Cannot afford right now (balance would go negative or breach 0)
  if (remainingProjectedBalance < 0) {
    recommendation = 'RECONSIDER';
    reasons.push(
      `Purchase cost of ₹${purchaseAmount.toLocaleString('en-IN')} exceeds your entire current balance of ₹${currentBalance.toLocaleString('en-IN')}.`
    );
    if (expectedIncome > 0 && projectedBufferWithIncome >= totalProtectedReserves) {
      recommendation = 'WAIT';
      const daysUntilIncome = expectedIncomeDate ? Math.max(1, Math.ceil((expectedIncomeDate - now) / (1000 * 60 * 60 * 24))) : 14;
      reasons.push(
        `Your expected income of ₹${expectedIncome.toLocaleString('en-IN')} arrives in ~${daysUntilIncome} days. Waiting until then will make this purchase viable without impacting savings or emergency reserve.`
      );
      suggestedAction = `Delay this purchase by ${daysUntilIncome} days until your income/allowance is credited.`;
    } else {
      reasons.push(
        `Even after anticipated income and paying mandatory obligations, your buffer would remain severely constrained.`
      );
      suggestedAction = `Skip or significantly reduce this purchase to avoid a deficit.`;
    }
  }
  // Case B: Breaches Emergency Reserve (untouchable money)
  else if (remainingProjectedBalance < emergencyReserve) {
    if (expectedIncome > 0 && projectedBufferWithIncome >= totalProtectedReserves) {
      recommendation = 'WAIT';
      const daysUntilIncome = expectedIncomeDate ? Math.max(1, Math.ceil((expectedIncomeDate - now) / (1000 * 60 * 60 * 24))) : 14;
      reasons.push(
        `Spending ₹${purchaseAmount.toLocaleString('en-IN')} leaves ₹${remainingProjectedBalance.toLocaleString('en-IN')}, which temporarily dips below your ₹${emergencyReserve.toLocaleString('en-IN')} emergency safety reserve.`
      );
      reasons.push(
        `However, your expected income of ₹${expectedIncome.toLocaleString('en-IN')} arrives in ~${daysUntilIncome} days. Waiting until then will make this purchase viable without breaching your safety cushion.`
      );
      suggestedAction = `Wait ~${daysUntilIncome} days until income arrives so your emergency reserve is never compromised.`;
    } else if (priority === 'essential' && remainingProjectedBalance >= 0) {
      recommendation = 'WAIT';
      reasons.push(
        `This purchase leaves you with ₹${remainingProjectedBalance.toLocaleString('en-IN')}, dipping into your required ₹${emergencyReserve.toLocaleString('en-IN')} emergency safety reserve.`
      );
      reasons.push(`Because it is marked essential, consider deferring other non-essential spending or waiting for incoming funds.`);
      suggestedAction = `Wait until income arrives or emergency reserve is replenished.`;
    } else {
      recommendation = 'RECONSIDER';
      reasons.push(
        `Spending ₹${purchaseAmount.toLocaleString('en-IN')} leaves only ₹${remainingProjectedBalance.toLocaleString('en-IN')}, which violates your emergency safety reserve of ₹${emergencyReserve.toLocaleString('en-IN')}.`
      );
      suggestedAction = `Protect your emergency cushion of ₹${emergencyReserve.toLocaleString('en-IN')}. Reconsider or find a cheaper alternative.`;
    }
  }
  // Case C: Preserves Emergency Reserve, but encroaches on Remaining Savings Target
  else if (remainingProjectedBalance < totalProtectedReserves) {
    const encroachment = totalProtectedReserves - remainingProjectedBalance;
    if (expectedIncome > 0 && projectedBufferWithIncome >= totalProtectedReserves) {
      recommendation = 'WAIT';
      const daysUntilIncome = expectedIncomeDate ? Math.max(1, Math.ceil((expectedIncomeDate - now) / (1000 * 60 * 60 * 24))) : 14;
      reasons.push(
        `While your ₹${emergencyReserve.toLocaleString('en-IN')} emergency cushion remains intact, spending ₹${purchaseAmount.toLocaleString('en-IN')} leaves ₹${remainingProjectedBalance.toLocaleString('en-IN')}, which encroaches upon your remaining monthly savings target of ₹${remainingSavingsTarget.toLocaleString('en-IN')} by ₹${encroachment.toLocaleString('en-IN')}.`
      );
      reasons.push(
        `Waiting ~${daysUntilIncome} days for your expected income of ₹${expectedIncome.toLocaleString('en-IN')} allows you to make this purchase while keeping your savings commitment intact.`
      );
      suggestedAction = `Wait until your next allowance/income arrives so your ₹${savingsTarget.toLocaleString('en-IN')} monthly savings goal remains fully protected.`;
    } else if (priority === 'essential') {
      recommendation = 'WAIT';
      reasons.push(
        `Emergency reserve is preserved, but purchasing now reduces remaining funds to ₹${remainingProjectedBalance.toLocaleString('en-IN')}, which falls ₹${encroachment.toLocaleString('en-IN')} short of your savings commitment.`
      );
      suggestedAction = `If this essential need cannot be delayed, consider adjusting your monthly savings target for this cycle.`;
    } else {
      recommendation = 'RECONSIDER';
      reasons.push(
        `Spending ₹${purchaseAmount.toLocaleString('en-IN')} leaves ₹${remainingProjectedBalance.toLocaleString('en-IN')}. While your ₹${emergencyReserve.toLocaleString('en-IN')} emergency reserve is untouched, this encroaches upon your remaining savings target (₹${remainingSavingsTarget.toLocaleString('en-IN')}) by ₹${encroachment.toLocaleString('en-IN')}.`
      );
      reasons.push(
        `You have saved ₹${actualSavings.toLocaleString('en-IN')} out of ₹${savingsTarget.toLocaleString('en-IN')} this month. This purchase would compromise your remaining ₹${remainingSavingsTarget.toLocaleString('en-IN')} target.`
      );
      suggestedAction = `Reconsider to protect your savings target. Safe discretionary spending right now is ₹${safeDiscretionarySpending.toLocaleString('en-IN')}.`;
    }
  }
  // Case D: College fee or critical obligation due soon that would be compromised
  else if (immediateBufferAfterObligations < totalProtectedReserves) {
    if (expectedIncome > 0 && projectedBufferWithIncome >= totalProtectedReserves) {
      recommendation = 'WAIT';
      const nearestObligation = pendingObligations.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
      const dueDays = nearestObligation ? Math.ceil((new Date(nearestObligation.dueDate) - now) / (1000 * 60 * 60 * 24)) : 0;
      reasons.push(
        `You have upcoming obligations of ₹${upcomingCommitmentsTotal.toLocaleString('en-IN')} (including "${nearestObligation?.title || 'college fee'}" due in ${dueDays} days).`
      );
      reasons.push(
        `Purchasing today leaves only ₹${immediateBufferAfterObligations.toLocaleString('en-IN')} after obligations, falling short of your protected reserve and savings goal (₹${totalProtectedReserves.toLocaleString('en-IN')}).`
      );
      reasons.push(`However, with expected income of ₹${expectedIncome.toLocaleString('en-IN')}, this purchase is safe if postponed.`);
      suggestedAction = `Wait until your upcoming bills are cleared and next income is credited before buying.`;
    } else {
      recommendation = 'RECONSIDER';
      reasons.push(
        `Your upcoming obligations (₹${upcomingCommitmentsTotal.toLocaleString('en-IN')}) will not leave enough funds to cover both this purchase and your safety reserves.`
      );
      suggestedAction = `Prioritize clearing your ${criticalObligations.length > 0 ? 'college fee/obligations' : 'bills'} first before discretionary spending.`;
    }
  }
  // Case E: Fits comfortably above emergency reserve AND preserves remaining savings target!
  else {
    recommendation = 'BUY NOW';
    reasons.push(
      `Your current balance of ₹${currentBalance.toLocaleString('en-IN')} comfortably covers this purchase of ₹${purchaseAmount.toLocaleString('en-IN')}.`
    );
    reasons.push(
      `After this purchase, you will retain ₹${remainingProjectedBalance.toLocaleString('en-IN')}, fully preserving both your ₹${emergencyReserve.toLocaleString('en-IN')} emergency reserve and your remaining ₹${remainingSavingsTarget.toLocaleString('en-IN')} savings commitment.`
    );
    if (upcomingCommitmentsTotal > 0) {
      reasons.push(
        `All upcoming obligations of ₹${upcomingCommitmentsTotal.toLocaleString('en-IN')} are fully protected with a remaining buffer of ₹${immediateBufferAfterObligations.toLocaleString('en-IN')}.`
      );
    }
    suggestedAction = `You can safely make this purchase according to your current financial plan.`;
  }

  // Generate actionable alternatives
  const budgetAlternativePrice = Math.round(purchaseAmount * 0.6);
  alternativeSuggestions.push({
    title: 'Budget Alternative',
    description: `Look for options or open-box deals around ₹${budgetAlternativePrice.toLocaleString('en-IN')}`,
    potentialSavings: purchaseAmount - budgetAlternativePrice,
  });

  if (recommendation !== 'BUY NOW') {
    alternativeSuggestions.push({
      title: 'Wait for Next Allowance Cycle',
      description: `Postpone until allowance date to preserve emergency safety margin and savings target`,
      potentialSavings: 0,
    });
  }

  alternativeSuggestions.push({
    title: 'Installment Savings Plan',
    description: `Save ₹${Math.round(purchaseAmount / 4).toLocaleString('en-IN')} per week over 4 weeks to buy with zero risk`,
    potentialSavings: 0,
  });

  return {
    recommendation,
    calculatedFinancialCapacity: discretionaryCapacity,
    remainingProjectedBalance,
    discretionaryCapacity,
    safeDiscretionarySpending,
    safetyReserve: emergencyReserve,
    savingsTarget,
    actualSavings,
    remainingSavingsTarget,
    totalProtectedReserves,
    upcomingCommitmentsTotal,
    reasons,
    suggestedAction,
    alternativeSuggestions,
    details: {
      currentBalance,
      purchaseAmount,
      emergencyReserve,
      savingsTarget,
      actualSavings,
      remainingSavingsTarget,
      totalProtectedReserves,
      safeDiscretionarySpending,
      upcomingCommitmentsTotal,
      expectedIncome,
      incomeArrivesBeforePurchase,
      immediateBufferAfterObligations,
      projectedBufferWithIncome,
      pendingObligationsCount: pendingObligations.length,
    },
  };
}
