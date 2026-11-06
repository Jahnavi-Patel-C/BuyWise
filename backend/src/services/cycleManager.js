/**
 * BuyWise Savings Cycle Manager
 * 
 * Manages the transition and accounting consistency across savings cycles:
 * 1. Tracks current cycle's progress towards the active monthly (or weekly) savings target.
 * 2. Carries forward total accumulated savings into lifetime wealth (`totalAccumulatedSavings`).
 * 3. Resets `actualSavings` to 0 at the start of a new cycle so the fresh cycle's target is protected.
 * 4. Ensures transferred savings are NEVER treated as liquid spendable cash.
 */

/**
 * Checks whether the current profile has entered a new savings cycle and executes rollover.
 * @param {Object} profile - Plain object or Mongoose document
 * @param {Date|string} asOfDate - Date to check against (defaults to now)
 * @returns {Object} { rolledOver: boolean, profile: Object, carriedForward: number }
 */
export function checkAndRolloverSavingsCycle(profile, asOfDate = new Date()) {
  if (!profile) return { rolledOver: false, profile, carriedForward: 0 };

  const now = new Date(asOfDate);
  const cycleStart = profile.currentCycleStart
    ? new Date(profile.currentCycleStart)
    : new Date(profile.createdAt || now.getFullYear(), now.getMonth(), 1);

  let isNewCycle = false;

  if (profile.allowanceFrequency === 'weekly') {
    const diffDays = Math.floor((now.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
    isNewCycle = diffDays >= 7;
  } else {
    // Monthly cycle (standard for student allowances)
    isNewCycle =
      now.getFullYear() > cycleStart.getFullYear() ||
      (now.getFullYear() === cycleStart.getFullYear() && now.getMonth() > cycleStart.getMonth());
  }

  if (isNewCycle) {
    const currentCycleActual = Number(profile.actualSavings || 0);
    const existingAccumulated = Number(profile.totalAccumulatedSavings || 0);

    // Carry forward: ensure lifetime accumulated savings includes previous cycle savings
    // If totalAccumulatedSavings was already tracked via transactions, preserve it;
    // if uninitialized or smaller than actualSavings, baseline it with currentCycleActual
    const newAccumulated = Math.max(existingAccumulated, currentCycleActual);

    profile.totalAccumulatedSavings = newAccumulated;
    profile.actualSavings = 0; // Fresh slate for the new cycle's monthly target

    if (profile.allowanceFrequency === 'weekly') {
      const newWeeklyStart = new Date(now);
      newWeeklyStart.setHours(0, 0, 0, 0);
      profile.currentCycleStart = newWeeklyStart;
    } else {
      profile.currentCycleStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    return {
      rolledOver: true,
      profile,
      carriedForward: currentCycleActual,
      totalAccumulatedSavings: newAccumulated,
    };
  }

  return {
    rolledOver: false,
    profile,
    carriedForward: 0,
    totalAccumulatedSavings: Number(profile.totalAccumulatedSavings || 0),
  };
}

/**
 * Helper to compute accounting breakdown with full cycle clarity
 */
export function computeSavingsAccounting({
  currentBalance = 0,
  emergencyReserve = 500,
  savingsTarget = 0,
  actualSavings = 0,
  totalAccumulatedSavings = 0,
}) {
  const liquidBalance = Number(currentBalance);
  const reserve = Number(emergencyReserve);
  const target = Number(savingsTarget);
  const actual = Number(actualSavings);
  const accumulated = Number(totalAccumulatedSavings);

  const remainingSavingsTarget = Math.max(0, target - actual);
  const totalProtectedReserves = reserve + remainingSavingsTarget;
  const safeDiscretionarySpending = Math.max(0, liquidBalance - totalProtectedReserves);

  return {
    liquidBalance,
    emergencyReserve: reserve,
    monthlySavingsTarget: target,
    actualSavings: actual,
    remainingSavingsTarget,
    totalProtectedReserves,
    safeDiscretionarySpending,
    totalAccumulatedSavings: Math.max(accumulated, actual),
  };
}
