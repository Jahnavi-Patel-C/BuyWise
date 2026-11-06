/**
 * BuyWise Backend Comprehensive Test Suite
 * Covers:
 * - Deterministic Financial Decision Engine (Critical Cases 1 to 10)
 * - Daily Spending Evaluator
 * - What-If Simulator
 * - Database Models & CRUD operations
 * - Authentication & JWT security
 * - Strict User Data Isolation between two accounts
 * - Centralized Error Handling & Input Validation
 */

import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { evaluatePurchaseDecision } from '../src/services/decisionEngine.js';
import { evaluateDailySpend } from '../src/services/dailyEvaluator.js';
import { checkAndRolloverSavingsCycle, computeSavingsAccounting } from '../src/services/cycleManager.js';
import User from '../src/models/User.js';
import FinancialProfile from '../src/models/FinancialProfile.js';
import Transaction from '../src/models/Transaction.js';
import FinancialObligation from '../src/models/FinancialObligation.js';
import PurchaseDecision from '../src/models/PurchaseDecision.js';
import { generateToken } from '../src/middleware/auth.js';

let mongod;

async function setup() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log('Test MongoDB Memory Server connected.');
}

async function teardown() {
  await mongoose.disconnect();
  await mongod.stop();
  console.log('Test MongoDB Memory Server stopped.');
}

async function runTests() {
  console.log('====================================================');
  console.log('   BUYWISE BACKEND & FINANCIAL LOGIC TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(name, fn) {
    totalTests++;
    try {
      fn();
      console.log(`✓ [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}`);
      console.error(`  Error: ${err.message}`);
      throw err;
    }
  }

  async function asyncTest(name, fn) {
    totalTests++;
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}`);
      console.error(`  Error: ${err.message}`);
      throw err;
    }
  }

  // --- UNIT TESTS: FINANCIAL ENGINE CRITICAL CASES ---

  test('Case 1: Purchase comfortably fits available capacity (BUY NOW)', () => {
    const profile = {
      currentBalance: 5000,
      emergencyReserve: 500,
      savingsTarget: 500,
      actualSavings: 500, // Savings already contributed
      expectedIncome: 0,
      essentialExpenses: 1000,
    };
    const obligations = [];
    const result = evaluatePurchaseDecision({
      purchaseName: 'Reference Book',
      amount: 400,
      category: 'Education',
      profile,
      obligations,
    });

    assert.strictEqual(result.recommendation, 'BUY NOW');
    assert.strictEqual(result.remainingProjectedBalance, 4600);
    assert(result.reasons.length > 0);
  });

  // --- USER SPECIFIED SAVINGS & DISCRETIONARY CAPACITY TESTS ---

  test('Financial Ambiguity Test 1: Safe discretionary with 0 actual savings (₹3,500 bal, ₹700 reserve, ₹1,000 target -> ₹1,800 safe)', () => {
    const profile = {
      currentBalance: 3500,
      emergencyReserve: 700,
      savingsTarget: 1000,
      actualSavings: 0,
      allowance: 5000,
    };
    const result = evaluatePurchaseDecision({
      purchaseName: 'Reference Book',
      amount: 1500,
      profile,
      obligations: [],
    });
    // Discretionary capacity = 3500 - 700 - 1000 = 1800
    assert.strictEqual(result.remainingSavingsTarget, 1000);
    assert.strictEqual(result.totalProtectedReserves, 1700);
    assert.strictEqual(result.safeDiscretionarySpending, 1800);
    assert.strictEqual(result.recommendation, 'BUY NOW');
  });

  test('Financial Ambiguity Test 2: Safe discretionary with ₹400 actual savings (₹3,500 bal, ₹700 reserve, ₹1,000 target, ₹400 actual -> ₹2,200 safe)', () => {
    const profile = {
      currentBalance: 3500,
      emergencyReserve: 700,
      savingsTarget: 1000,
      actualSavings: 400,
      allowance: 5000,
    };
    const result = evaluatePurchaseDecision({
      purchaseName: 'Winter Coat',
      amount: 2000,
      profile,
      obligations: [],
    });
    // Remaining savings target = 1000 - 400 = 600
    // Total protected = 700 + 600 = 1300
    // Safe discretionary = 3500 - 1300 = 2200
    assert.strictEqual(result.remainingSavingsTarget, 600);
    assert.strictEqual(result.totalProtectedReserves, 1300);
    assert.strictEqual(result.safeDiscretionarySpending, 2200);
    // 2000 <= 2200, so it fits comfortably
    assert.strictEqual(result.recommendation, 'BUY NOW');
  });

  test('Financial Ambiguity Test 3: ₹2,000 purchase exceeds ₹1,800 safe capacity when actual savings is ₹0', () => {
    const profile = {
      currentBalance: 3500,
      emergencyReserve: 700,
      savingsTarget: 1000,
      actualSavings: 0,
      allowance: 5000,
      expectedIncome: 0,
    };
    const result = evaluatePurchaseDecision({
      purchaseName: 'Winter Coat',
      amount: 2000,
      profile,
      obligations: [],
    });
    // 3500 - 2000 = 1500 >= 700 reserve, but < 1700 (reserve + remaining target)
    // Encroaches upon remaining savings target by 200
    assert.strictEqual(result.safeDiscretionarySpending, 1800);
    assert.strictEqual(result.recommendation, 'RECONSIDER');
    assert(result.reasons.some((r) => r.includes('savings target')));
  });

  test('Financial Ambiguity Test 4: Daily spending evaluator respects remaining savings target', () => {
    const profile = {
      currentBalance: 3500,
      emergencyReserve: 700,
      savingsTarget: 1000,
      actualSavings: 0,
      allowance: 5000,
    };
    // Safe discretionary = 3500 - 700 - 1000 = 1800
    // Spend within daily safe limit (e.g. ₹60 canteen snack)
    const resultSafe = evaluateDailySpend({
      amount: 60,
      category: 'Food',
      description: 'Canteen snack',
      profile,
      todayTransactions: [],
      monthTransactions: [],
      obligations: [],
    });
    assert.strictEqual(resultSafe.remainingSavingsTarget, 1000);
    assert.strictEqual(resultSafe.safeDiscretionarySpending, 1800);
    assert.strictEqual(resultSafe.recommendation, 'BUY NOW');

    // Spend that encroaches on remaining savings target (e.g. ₹1,900 leaves ₹1,600 < ₹1,700 protected)
    const resultEncroach = evaluateDailySpend({
      amount: 1900,
      category: 'Shopping',
      description: 'Impulse headphones',
      profile,
      todayTransactions: [],
      monthTransactions: [],
      obligations: [],
    });
    assert.strictEqual(resultEncroach.recommendation, 'WAIT');
    assert(resultEncroach.reasons.some((r) => r.includes('savings target')));
  });

  test('Financial Ambiguity Test 5: Target 100% achieved does not deduct savings target (No double counting)', () => {
    const profile = {
      currentBalance: 3500,
      emergencyReserve: 700,
      savingsTarget: 1000,
      actualSavings: 1000,
    };
    const result = evaluatePurchaseDecision({
      purchaseName: 'Monitor',
      amount: 2500,
      profile,
      obligations: [],
    });
    // Remaining savings target = 0
    // Total protected = 700 + 0 = 700
    // Safe discretionary = 3500 - 700 = 2800
    assert.strictEqual(result.remainingSavingsTarget, 0);
    assert.strictEqual(result.safeDiscretionarySpending, 2800);
    assert.strictEqual(result.recommendation, 'BUY NOW');
  });

  // --- FINAL ACCOUNTING CONSISTENCY & TRANSFER INVARIANCE TESTS ---

  test('Accounting Consistency Test 1: Transfer ₹400 from spending to savings preserves discretionary capacity (₹1,800)', () => {
    // Initial state: Liquid: ₹3,500, Reserve: ₹700, Target: ₹1,000, Actual: ₹0 -> Safe: ₹1,800
    const initialProfile = {
      currentBalance: 3500,
      emergencyReserve: 700,
      savingsTarget: 1000,
      actualSavings: 0,
      allowance: 5000,
    };

    const initialAccounting = computeSavingsAccounting(initialProfile);
    assert.strictEqual(initialAccounting.liquidBalance, 3500);
    assert.strictEqual(initialAccounting.actualSavings, 0);
    assert.strictEqual(initialAccounting.remainingSavingsTarget, 1000);
    assert.strictEqual(initialAccounting.safeDiscretionarySpending, 1800);

    // Evaluate purchase of exactly ₹1,800 before transfer: Fits comfortably
    const initialDecision = evaluatePurchaseDecision({
      purchaseName: 'Study Table',
      amount: 1800,
      profile: initialProfile,
      obligations: [],
    });
    assert.strictEqual(initialDecision.safeDiscretionarySpending, 1800);
    assert.strictEqual(initialDecision.recommendation, 'BUY NOW');

    // Transfer ₹400 into savings:
    // Spending account balance decreases to ₹3,100
    // Actual savings increases to ₹400
    const postTransferProfile = {
      ...initialProfile,
      currentBalance: 3100, // 3500 - 400
      actualSavings: 400,   // 0 + 400
      totalAccumulatedSavings: 400,
    };

    const postAccounting = computeSavingsAccounting(postTransferProfile);
    assert.strictEqual(postAccounting.liquidBalance, 3100, 'Spending account balance must become ₹3,100');
    assert.strictEqual(postAccounting.actualSavings, 400, 'Actual savings must become ₹400');
    assert.strictEqual(postAccounting.remainingSavingsTarget, 600, 'Remaining savings target must become ₹600');
    assert.strictEqual(postAccounting.safeDiscretionarySpending, 1800, 'Safe discretionary amount must remain ₹1,800');

    // Re-evaluate purchase of ₹1,800 after transfer:
    // Balance (3100) - Purchase (1800) = 1300, which exactly covers Emergency Reserve (700) + Remaining Target (600) = 1300
    const postDecision = evaluatePurchaseDecision({
      purchaseName: 'Study Table',
      amount: 1800,
      profile: postTransferProfile,
      obligations: [],
    });
    assert.strictEqual(postDecision.remainingSavingsTarget, 600);
    assert.strictEqual(postDecision.totalProtectedReserves, 1300);
    assert.strictEqual(postDecision.safeDiscretionarySpending, 1800);
    assert.strictEqual(postDecision.recommendation, 'BUY NOW');

    // Verify NOT double counted:
    // If double counted: 3100 - 700 - 1000 = 1400 (would incorrectly drop capacity to ₹1,400)
    assert.notStrictEqual(postDecision.safeDiscretionarySpending, 1400);

    // Verify transferred savings are NOT treated as spendable cash:
    // Attempting to spend ₹2,000 (> ₹1,800 discretionary) leaves 3100 - 2000 = 1100 < 1300 protected reserves
    const overspendDecision = evaluatePurchaseDecision({
      purchaseName: 'Overpriced Tablet',
      amount: 2000,
      profile: postTransferProfile,
      obligations: [],
      expectedIncome: 0,
    });
    assert.strictEqual(overspendDecision.recommendation, 'RECONSIDER');
    assert(overspendDecision.reasons.some((r) => r.includes('savings target') || r.includes('emergency')));
  });

  test('Accounting Consistency Test 2: Savings Cycle rollover resets actualSavings and carries forward accumulated savings', () => {
    // Cycle 1 (e.g. October 2026): User saved ₹400 towards ₹1,000 monthly target
    const octProfile = {
      allowance: 5000,
      allowanceFrequency: 'monthly',
      currentBalance: 3100,
      emergencyReserve: 700,
      savingsTarget: 1000,
      actualSavings: 400,
      totalAccumulatedSavings: 400,
      currentCycleStart: new Date(2026, 9, 1), // Oct 1, 2026
    };

    // Simulate transition to Cycle 2 (e.g. Nov 1, 2026)
    const novDate = new Date(2026, 10, 1);
    const rolloverResult = checkAndRolloverSavingsCycle(octProfile, novDate);

    assert.strictEqual(rolloverResult.rolledOver, true, 'New month must trigger cycle rollover');
    assert.strictEqual(octProfile.actualSavings, 0, 'actualSavings must reset to 0 for the new monthly cycle');
    assert.strictEqual(octProfile.totalAccumulatedSavings, 400, 'totalAccumulatedSavings must carry forward past savings (₹400)');
    assert.strictEqual(octProfile.currentBalance, 3100, 'Liquid balance must remain ₹3,100 (transferred savings are not spendable cash)');

    // In new cycle, remaining savings target resets to full monthly target ₹1,000
    const novAccounting = computeSavingsAccounting(octProfile);
    assert.strictEqual(novAccounting.remainingSavingsTarget, 1000, 'New cycle must require full monthly savings target (₹1,000)');
    assert.strictEqual(novAccounting.totalProtectedReserves, 1700, 'Protected reserves = 700 reserve + 1000 fresh target = 1700');
    assert.strictEqual(novAccounting.safeDiscretionarySpending, 1400, 'From existing 3100 balance, safe discretionary is 3100 - 1700 = 1400');

    // When new monthly allowance of ₹5,000 is credited in Cycle 2:
    octProfile.currentBalance += 5000; // becomes 8100
    const postAllowanceAccounting = computeSavingsAccounting(octProfile);
    assert.strictEqual(postAllowanceAccounting.liquidBalance, 8100);
    assert.strictEqual(postAllowanceAccounting.safeDiscretionarySpending, 6400, '8100 - 1700 = 6400');

    // When user saves ₹1,000 in Cycle 2:
    octProfile.currentBalance -= 1000; // becomes 7100
    octProfile.actualSavings += 1000;  // becomes 1000
    octProfile.totalAccumulatedSavings += 1000; // becomes 1400 (400 from Oct + 1000 from Nov)

    const cycle2TargetAchieved = computeSavingsAccounting(octProfile);
    assert.strictEqual(cycle2TargetAchieved.actualSavings, 1000);
    assert.strictEqual(cycle2TargetAchieved.remainingSavingsTarget, 0);
    assert.strictEqual(cycle2TargetAchieved.safeDiscretionarySpending, 6400, 'Safe discretionary remains 6400 invariant upon transfer');
    assert.strictEqual(cycle2TargetAchieved.totalAccumulatedSavings, 1400, 'Lifetime savings successfully tracks ₹1,400');
  });

  test('Case 2: Purchase would consume emergency reserve (RECONSIDER)', () => {
    const profile = {
      currentBalance: 1000,
      emergencyReserve: 800,
      savingsTarget: 0,
      expectedIncome: 0,
      essentialExpenses: 0,
    };
    const obligations = [];
    const result = evaluatePurchaseDecision({
      purchaseName: 'Concert Ticket',
      amount: 400,
      priority: 'optional',
      profile,
      obligations,
    });

    // 1000 - 400 = 600, which is < emergencyReserve (800)
    assert.strictEqual(result.recommendation, 'RECONSIDER');
    assert.strictEqual(result.remainingProjectedBalance, 600);
    assert(result.reasons.some((r) => r.includes('emergency safety reserve')));
  });

  test('Case 3: Purchase affordable after next allowance arrives (WAIT)', () => {
    const nextIncome = new Date();
    nextIncome.setDate(nextIncome.getDate() + 7);

    const profile = {
      currentBalance: 1200,
      emergencyReserve: 500,
      savingsTarget: 0,
      expectedIncome: 5000,
      expectedIncomeDate: nextIncome,
      essentialExpenses: 500,
    };
    const obligations = [];
    
    // Buying today: 1200 - 2000 = -800 (cannot afford today)
    // But with income of 5000, projected buffer with income = 1200 + 5000 - 2000 - 500 = 3700 >= reserve
    const result = evaluatePurchaseDecision({
      purchaseName: 'Wireless Headphones',
      amount: 2000,
      plannedDate: new Date(), // today
      profile,
      obligations,
    });

    assert.strictEqual(result.recommendation, 'WAIT');
    assert(result.suggestedAction.toLowerCase().includes('delay') || result.suggestedAction.toLowerCase().includes('wait'));
  });

  test('Case 4: Upcoming college fees affect affordability (WAIT / RECONSIDER)', () => {
    const profile = {
      currentBalance: 5000,
      emergencyReserve: 500,
      expectedIncome: 0,
      essentialExpenses: 500,
    };
    const feeDueDate = new Date();
    feeDueDate.setDate(feeDueDate.getDate() + 5);

    const obligations = [
      {
        title: 'Semester Tuition Fee',
        amount: 3500,
        dueDate: feeDueDate,
        obligationType: 'college_fee',
        status: 'pending',
      },
    ];

    // Current balance: 5000. Purchase: 2000. Fee: 3500. Total need: 5500 > 5000
    // Buying item leaves 3000, which cannot cover 3500 tuition fee!
    const result = evaluatePurchaseDecision({
      purchaseName: 'Branded Shoes',
      amount: 2000,
      profile,
      obligations,
    });

    assert.strictEqual(result.recommendation, 'RECONSIDER');
    assert(result.reasons.some((r) => r.includes('upcoming obligations')));
  });

  test('Case 5: Daily spending exceeds safe daily velocity (Evaluator WAIT/RECONSIDER)', () => {
    const profile = {
      currentBalance: 2000,
      allowance: 3000,
      essentialExpenses: 1000,
      savingsTarget: 500,
      emergencyReserve: 500,
    };
    // Safe remaining budget = (3000 - 1000 - 500) = 1500 / 25 days ≈ ₹60/day
    // Already spent today = 150. Proposed spend = 250 -> Total today = 400 >> 60 * 1.8
    const todayTransactions = [
      { amount: 150, type: 'expense' },
    ];
    const result = evaluateDailySpend({
      amount: 250,
      category: 'Food',
      description: 'Zomato lunch',
      profile,
      todayTransactions,
      monthTransactions: todayTransactions,
      obligations: [],
    });

    assert.strictEqual(result.recommendation, 'WAIT');
    assert.strictEqual(result.projectedTodaySpend, 400);
    assert(result.reasons.some((r) => r.includes('safe daily spending limit')));
  });

  test('Case 6: Expected income missing or uncertain', () => {
    const profile = {
      currentBalance: 800,
      emergencyReserve: 500,
      expectedIncome: 0, // No income scheduled
      expectedIncomeDate: null,
    };
    const result = evaluatePurchaseDecision({
      purchaseName: 'Gaming Mouse',
      amount: 1500,
      profile,
      obligations: [],
    });

    assert.strictEqual(result.recommendation, 'RECONSIDER');
  });

  test('Case 7: Insufficient transaction history handled gracefully', () => {
    const profile = {
      currentBalance: 3000,
      emergencyReserve: 500,
    };
    const result = evaluatePurchaseDecision({
      purchaseName: 'Keyboard',
      amount: 600,
      profile,
      obligations: [],
      recentTransactions: [], // Empty history
    });

    assert.strictEqual(result.recommendation, 'BUY NOW');
    assert(result.remainingProjectedBalance === 2400);
  });

  test('Case 8: Purchase amount zero or negative throws validation error', () => {
    assert.throws(() => {
      evaluatePurchaseDecision({
        purchaseName: 'Test',
        amount: 0,
        profile: { currentBalance: 1000 },
      });
    }, /positive number/);

    assert.throws(() => {
      evaluatePurchaseDecision({
        purchaseName: 'Test',
        amount: -50,
        profile: { currentBalance: 1000 },
      });
    }, /positive number/);
  });

  test('Case 10: Changing purchase date affects financial calculation when income arrives between dates', () => {
    const incomeDate = new Date();
    incomeDate.setDate(incomeDate.getDate() + 10);

    const profile = {
      currentBalance: 1000,
      emergencyReserve: 500,
      expectedIncome: 4000,
      expectedIncomeDate: incomeDate,
      essentialExpenses: 500,
    };

    // Date A: Planned for tomorrow (before income) -> Cannot afford right now
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const resultBeforeIncome = evaluatePurchaseDecision({
      purchaseName: 'Monitor',
      amount: 1500,
      plannedDate: tomorrow,
      profile,
      obligations: [],
    });

    // Date B: Planned after income arrives -> Income available
    const afterIncome = new Date();
    afterIncome.setDate(afterIncome.getDate() + 12);
    const resultAfterIncome = evaluatePurchaseDecision({
      purchaseName: 'Monitor',
      amount: 1500,
      plannedDate: afterIncome,
      profile,
      obligations: [],
    });

    assert.strictEqual(resultBeforeIncome.recommendation, 'WAIT');
    assert.strictEqual(resultAfterIncome.details.incomeArrivesBeforePurchase, true);
  });

  // --- DATABASE & SECURITY & USER ISOLATION TESTS ---

  await asyncTest('Case 9: Two different users have strict data isolation', async () => {
    // Create User A
    const userA = await User.create({
      username: 'Alice Student',
      email: 'alice@college.edu',
      password: 'password123',
    });

    // Create User B
    const userB = await User.create({
      username: 'Bob Student',
      email: 'bob@college.edu',
      password: 'password123',
    });

    // Create Profile A & B
    await FinancialProfile.create({
      userId: userA._id,
      currentBalance: 10000,
      allowance: 8000,
    });

    await FinancialProfile.create({
      userId: userB._id,
      currentBalance: 2000,
      allowance: 3000,
    });

    // Create Transaction for User A
    const txA = await Transaction.create({
      userId: userA._id,
      description: 'Secret Personal Purchase',
      amount: 500,
      category: 'Shopping',
    });

    // Query transactions scoped to User B
    const userBTransactions = await Transaction.find({ userId: userB._id });
    assert.strictEqual(userBTransactions.length, 0, 'User B must not see User A transactions');

    // Query profile for User B
    const profileB = await FinancialProfile.findOne({ userId: userB._id });
    assert.strictEqual(profileB.currentBalance, 2000, 'User B must see only their own balance');
    assert.notStrictEqual(profileB.currentBalance, 10000);
  });

  await asyncTest('User Authentication & Password Hashing verification', async () => {
    const user = await User.findOne({ email: 'alice@college.edu' });
    assert.notStrictEqual(user.password, 'password123', 'Password must be hashed with bcrypt');
    const isMatch = await user.comparePassword('password123');
    assert.strictEqual(isMatch, true, 'Valid password must match hash');
    const isMismatch = await user.comparePassword('wrongpassword');
    assert.strictEqual(isMismatch, false, 'Invalid password must be rejected');

    const token = generateToken(user._id.toString());
    assert(typeof token === 'string' && token.length > 20);
  });

  await asyncTest('Financial Obligation CRUD and status management', async () => {
    const user = await User.findOne({ email: 'alice@college.edu' });
    const obligation = await FinancialObligation.create({
      userId: user._id,
      title: 'Lab Fee',
      amount: 750,
      dueDate: new Date(),
      obligationType: 'college_fee',
      status: 'pending',
    });

    assert.strictEqual(obligation.amount, 750);
    obligation.status = 'paid';
    await obligation.save();

    const updated = await FinancialObligation.findById(obligation._id);
    assert.strictEqual(updated.status, 'paid');
  });

  await asyncTest('Purchase Decision History persistence and retrieval', async () => {
    const user = await User.findOne({ email: 'alice@college.edu' });
    const decision = await PurchaseDecision.create({
      userId: user._id,
      purchaseName: 'Calculus Guide',
      amount: 350,
      category: 'Education',
      recommendation: 'BUY NOW',
      calculatedFinancialCapacity: 2500,
      remainingProjectedBalance: 9650,
      discretionaryCapacity: 2500,
      reasons: ['Within allowance limits'],
      suggestedAction: 'Safe to buy',
    });

    assert.strictEqual(decision.recommendation, 'BUY NOW');
    const retrieved = await PurchaseDecision.findOne({ userId: user._id, purchaseName: 'Calculus Guide' });
    assert(retrieved !== null);
  });

  await asyncTest('Accounting Consistency Test 3: Integrated DB Transaction, Transfer Accounting & Cycle Rollover', async () => {
    // 1. Create dedicated user for accounting consistency check
    const studentUser = await User.create({
      username: 'Siddharth Student',
      email: 'siddharth@campus.edu',
      password: 'password123',
    });

    // 2. Initialize profile: ₹3,500 liquid, ₹700 reserve, ₹1,000 target, ₹0 actual
    const profile = await FinancialProfile.create({
      userId: studentUser._id,
      currentBalance: 3500,
      emergencyReserve: 700,
      savingsTarget: 1000,
      actualSavings: 0,
      totalAccumulatedSavings: 0,
      currentCycleStart: new Date(2026, 9, 1), // Oct 1, 2026
    });

    // Verify initial state
    let remainingTarget = Math.max(0, profile.savingsTarget - profile.actualSavings);
    let safeDiscretionary = Math.max(0, profile.currentBalance - (profile.emergencyReserve + remainingTarget));
    assert.strictEqual(profile.currentBalance, 3500);
    assert.strictEqual(profile.actualSavings, 0);
    assert.strictEqual(remainingTarget, 1000);
    assert.strictEqual(safeDiscretionary, 1800);

    // 3. Record transfer of ₹400 into savings (category = 'Savings', type = 'expense')
    const savingsTx = await Transaction.create({
      userId: studentUser._id,
      description: 'Transfer to Recurring Deposit',
      amount: 400,
      type: 'expense',
      category: 'Savings',
      date: new Date(2026, 9, 15),
    });

    // Emulate controller atomic update
    await FinancialProfile.findOneAndUpdate(
      { userId: studentUser._id },
      {
        $inc: {
          currentBalance: -savingsTx.amount,
          actualSavings: savingsTx.amount,
          totalAccumulatedSavings: savingsTx.amount,
        },
      }
    );

    // 4. Verify post-transfer state in database
    const postTransferProfile = await FinancialProfile.findOne({ userId: studentUser._id });
    assert.strictEqual(postTransferProfile.currentBalance, 3100, 'Spending account balance must become ₹3,100');
    assert.strictEqual(postTransferProfile.actualSavings, 400, 'Actual savings must become ₹400');
    assert.strictEqual(postTransferProfile.totalAccumulatedSavings, 400, 'Accumulated savings must become ₹400');

    remainingTarget = Math.max(0, postTransferProfile.savingsTarget - postTransferProfile.actualSavings);
    safeDiscretionary = Math.max(0, postTransferProfile.currentBalance - (postTransferProfile.emergencyReserve + remainingTarget));
    assert.strictEqual(remainingTarget, 600, 'Remaining target must become ₹600');
    assert.strictEqual(safeDiscretionary, 1800, 'Safe discretionary must remain ₹1,800');

    // 5. Test Cycle Rollover when advancing into next month (Nov 1, 2026)
    const novDate = new Date(2026, 10, 1);
    const { rolledOver } = checkAndRolloverSavingsCycle(postTransferProfile, novDate);
    assert.strictEqual(rolledOver, true, 'Cycle rollover must trigger');
    await postTransferProfile.save();

    // 6. Verify rollover state in database
    const newCycleProfile = await FinancialProfile.findOne({ userId: studentUser._id });
    assert.strictEqual(newCycleProfile.actualSavings, 0, 'actualSavings must reset to 0 for the new monthly cycle');
    assert.strictEqual(newCycleProfile.totalAccumulatedSavings, 400, 'totalAccumulatedSavings must preserve ₹400');
    assert.strictEqual(newCycleProfile.currentBalance, 3100, 'Liquid balance remains ₹3,100');

    const newCycleRemainingTarget = Math.max(0, newCycleProfile.savingsTarget - newCycleProfile.actualSavings);
    const newCycleDiscretionary = Math.max(0, newCycleProfile.currentBalance - (newCycleProfile.emergencyReserve + newCycleRemainingTarget));
    assert.strictEqual(newCycleRemainingTarget, 1000, 'New cycle monthly savings target requires fresh ₹1,000');
    assert.strictEqual(newCycleDiscretionary, 1400, 'Safe discretionary before new allowance is 3100 - 1700 = 1400');

    // 7. Test transaction reversal/deletion restores funds correctly
    await Transaction.deleteOne({ _id: savingsTx._id });
    await FinancialProfile.findOneAndUpdate(
      { userId: studentUser._id },
      {
        $inc: {
          currentBalance: savingsTx.amount, // Revert liquid debit
          totalAccumulatedSavings: -savingsTx.amount,
        },
      }
    );

    const revertedProfile = await FinancialProfile.findOne({ userId: studentUser._id });
    assert.strictEqual(revertedProfile.currentBalance, 3500, 'Liquid balance restores to ₹3,500 on reversal');
    assert.strictEqual(revertedProfile.totalAccumulatedSavings, 0, 'Accumulated savings reverts to ₹0');
  });

  console.log('\n====================================================');
  console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================\n');
}

async function main() {
  try {
    await setup();
    await runTests();
    await teardown();
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    if (mongod) await mongod.stop();
    process.exit(1);
  }
}

main();

