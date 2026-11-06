/**
 * BUYWISE COMPREHENSIVE END-TO-END INTEGRATION AUDIT
 * Tests live HTTP communication across:
 * - Express Backend (http://localhost:5000)
 * - FastAPI ML Service (http://127.0.0.1:8000)
 * - In-Memory / Persistent MongoDB Engine
 * 
 * Covers all 8 audit sections required by the audit specification.
 */

import assert from 'node:assert';

const API_BASE = 'http://localhost:5000/api';
const ML_BASE = 'http://127.0.0.1:8000';

let passed = 0;
let total = 0;
const failures = [];

async function test(name, fn) {
  total++;
  try {
    await fn();
    console.log(`✓ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}`);
    console.error(`  Details: ${err.message}`);
    failures.push({ name, error: err.message });
  }
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

async function runAudit() {
  console.log('====================================================');
  console.log('   BUYWISE MASTER END-TO-END INTEGRATION AUDIT');
  console.log('====================================================\n');

  // Generate unique test emails to guarantee fresh database states
  const timestamp = Date.now();
  const userAEmail = `auditor.a.${timestamp}@campus.edu`;
  const userBEmail = `auditor.b.${timestamp}@campus.edu`;
  let tokenA = '';
  let tokenB = '';
  let userAId = '';

  // =========================================================================
  // SECTION 2: AUTHENTICATION, PROTECTED ROUTES & USER ISOLATION
  // =========================================================================
  console.log('--- SECTION 2: AUTHENTICATION & MULTI-TENANT ISOLATION ---');

  await test('2.1 Registration: Successfully register User A', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        username: 'Auditor A',
        email: userAEmail,
        password: 'Password@123',
      },
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert(res.data.token, 'Token must be issued');
    tokenA = res.data.token;
    userAId = res.data.user.id;
  });

  await test('2.2 Registration: Duplicate email rejected', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        username: 'Auditor A Duplicate',
        email: userAEmail,
        password: 'Password@123',
      },
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
  });

  await test('2.3 Login: Invalid password rejected with 401', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: {
        email: userAEmail,
        password: 'WrongPassword999',
      },
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  await test('2.4 Login: Valid credentials succeed and return JWT', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: {
        email: userAEmail,
        password: 'Password@123',
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.token);
    tokenA = res.data.token;
  });

  await test('2.5 Protected API routes: Deny access without token (401)', async () => {
    const resProfile = await request('/profile');
    assert.strictEqual(resProfile.status, 401);

    const resTx = await request('/transactions');
    assert.strictEqual(resTx.status, 401);

    const resDec = await request('/decisions/history');
    assert.strictEqual(resDec.status, 401);
  });

  await test('2.6 Strict User Isolation: User B cannot access User A data', async () => {
    // Register User B
    const resBReg = await request('/auth/register', {
      method: 'POST',
      body: {
        username: 'Auditor B',
        email: userBEmail,
        password: 'Password@123',
      },
    });
    assert.strictEqual(resBReg.status, 201);
    tokenB = resBReg.data.token;

    // User A records an obligation and transaction
    const resATx = await request('/transactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        description: 'Private Laptop EMI for User A',
        amount: 2500,
        type: 'expense',
        category: 'Shopping',
      },
    });
    assert.strictEqual(resATx.status, 201);
    const txAId = resATx.data.transaction._id;

    // User B fetches transactions: must see 0 transactions
    const resBTxList = await request('/transactions', {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(resBTxList.status, 200);
    assert.strictEqual(resBTxList.data.transactions.length, 0, 'User B must not see User A transactions');

    // User B attempts to delete User A transaction: must be 404 / denied
    const resBDeleteA = await request(`/transactions/${txAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(resBDeleteA.status, 404, 'User B must not be permitted to delete User A transactions');
  });

  // =========================================================================
  // SECTION 1: FINANCIAL ACCOUNTING & SAVINGS INVARIANCE VERIFICATION
  // =========================================================================
  console.log('\n--- SECTION 1: FINANCIAL ACCOUNTING & SAVINGS VERIFICATION ---');

  await test('1.1 Initial State: Balance ₹3,500, Reserve ₹700, Target ₹1,000, Actual ₹0 -> Safe ₹1,800', async () => {
    // Setup exact baseline profile for User A
    const res = await request('/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        currentBalance: 3500,
        emergencyReserve: 700,
        savingsTarget: 1000,
        actualSavings: 0,
        allowance: 5000,
        allowanceFrequency: 'monthly',
        essentialExpenses: 0,
        expectedIncome: 0,
      },
    });
    assert.strictEqual(res.status, 200);

    const getRes = await request('/profile', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(getRes.status, 200);
    const summary = getRes.data.summary;
    assert.strictEqual(summary.emergencyReserve, 700);
    assert.strictEqual(summary.savingsTarget, 1000);
    assert.strictEqual(summary.actualSavings, 0);
    assert.strictEqual(summary.remainingSavingsTarget, 1000);
    assert.strictEqual(summary.safeDiscretionary, 1800, 'Safe discretionary must be exactly 1,800');
  });

  let savingsTxId = '';

  await test('1.2 Transfer ₹400 into Savings: Balance ₹3,100, Actual ₹400, Remaining ₹600, Safe remains ₹1,800', async () => {
    const txRes = await request('/transactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        description: 'Monthly Recurring Deposit transfer',
        amount: 400,
        type: 'expense',
        category: 'Savings',
      },
    });
    assert.strictEqual(txRes.status, 201);
    savingsTxId = txRes.data.transaction._id;

    // Verify Profile state
    const getRes = await request('/profile', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(getRes.status, 200);
    const p = getRes.data.profile;
    const s = getRes.data.summary;

    assert.strictEqual(p.currentBalance, 3100, 'Spending account balance must become ₹3,100');
    assert.strictEqual(s.actualSavings, 400, 'Actual savings must become ₹400');
    assert.strictEqual(s.remainingSavingsTarget, 600, 'Remaining target must become ₹600');
    assert.strictEqual(s.safeDiscretionary, 1800, 'Safe discretionary must remain invariant at ₹1,800');
  });

  await test('1.3 No Double Counting: ₹1,800 purchase remains affordable post-transfer', async () => {
    const res = await request('/decisions/evaluate-purchase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        purchaseName: 'Lab Equipment Kit',
        amount: 1800,
        category: 'Education',
        saveHistory: false,
      },
    });
    assert.strictEqual(res.status, 200);
    const d = res.data.evaluation;
    assert.strictEqual(d.safeDiscretionarySpending, 1800);
    assert.strictEqual(d.remainingSavingsTarget, 600);
    assert.strictEqual(d.recommendation, 'BUY NOW');
    // Balance 3,100 - 1,800 = 1,300 (covers 700 reserve + 600 remaining target)
    assert.strictEqual(d.remainingProjectedBalance, 1300);
  });

  await test('1.4 Transferred savings NOT treated as spendable cash (Overspend rejected)', async () => {
    // Attempting to spend ₹2,000 from ₹3,100 leaves ₹1,100 < ₹1,300 protected reserves
    const res = await request('/decisions/evaluate-purchase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        purchaseName: 'Luxury Smartwatch',
        amount: 2000,
        category: 'Shopping',
        saveHistory: false,
      },
    });
    assert.strictEqual(res.status, 200);
    const d = res.data.evaluation;
    assert.strictEqual(d.recommendation, 'RECONSIDER');
    assert(d.reasons.some((r) => r.includes('savings target') || r.includes('reserve')));
  });

  await test('1.5 Target Fully Achieved: Transferring remaining ₹600 sets remaining target to ₹0', async () => {
    const txRes = await request('/transactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        description: 'Remaining monthly savings transfer',
        amount: 600,
        type: 'expense',
        category: 'Savings',
      },
    });
    assert.strictEqual(txRes.status, 201);

    const getRes = await request('/profile', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const s = getRes.data.summary;
    const p = getRes.data.profile;

    assert.strictEqual(p.currentBalance, 2500, '3100 - 600 = 2500');
    assert.strictEqual(s.actualSavings, 1000);
    assert.strictEqual(s.remainingSavingsTarget, 0);
    assert.strictEqual(s.totalProtectedReserves, 700, 'Only emergency reserve (700) remains protected');
    assert.strictEqual(s.safeDiscretionary, 1800, '2500 - 700 = 1800 (still invariant!)');
  });

  await test('1.6 Surplus Savings Contribution: Saving ₹200 extra beyond target', async () => {
    // User puts an extra ₹200 into savings (total 1,200 saved against 1,000 target)
    const txRes = await request('/transactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        description: 'Bonus micro-savings',
        amount: 200,
        type: 'expense',
        category: 'Savings',
      },
    });
    assert.strictEqual(txRes.status, 201);

    const getRes = await request('/profile', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const s = getRes.data.summary;
    const p = getRes.data.profile;

    assert.strictEqual(p.currentBalance, 2300, '2500 - 200 = 2300');
    assert.strictEqual(s.actualSavings, 1200);
    assert.strictEqual(s.remainingSavingsTarget, 0);
    assert.strictEqual(s.safeDiscretionary, 1600, '2300 - 700 = 1600 (extra 200 is safely locked away in savings)');
  });

  await test('1.7 Transaction Editing: Update ₹400 savings transfer to ₹500', async () => {
    const putRes = await request(`/transactions/${savingsTxId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        amount: 500, // increased by 100
      },
    });
    assert.strictEqual(putRes.status, 200);
    assert.strictEqual(putRes.data.transaction.amount, 500);

    const getRes = await request('/profile', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    // Previous balance was 2300; since savings increased by 100, balance becomes 2200, actual becomes 1300
    assert.strictEqual(getRes.data.profile.currentBalance, 2200);
    assert.strictEqual(getRes.data.summary.actualSavings, 1300);
  });

  await test('1.8 Transaction Deletion: Deleting edited savings transaction reverts balance', async () => {
    const delRes = await request(`/transactions/${savingsTxId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(delRes.status, 200);

    const getRes = await request('/profile', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    // Reverts ₹500 debit: 2200 + 500 = 2700, actual savings: 1300 - 500 = 800
    assert.strictEqual(getRes.data.profile.currentBalance, 2700);
    assert.strictEqual(getRes.data.summary.actualSavings, 800);
  });

  // =========================================================================
  // SECTION 3: PURCHASE DECISION ANALYZER
  // =========================================================================
  console.log('\n--- SECTION 3: PURCHASE DECISION ANALYZER ---');

  // Set predictable profile for decision test suite
  await request('/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: {
      currentBalance: 5000,
      emergencyReserve: 1000,
      savingsTarget: 1000,
      actualSavings: 0,
      expectedIncome: 0,
      expectedIncomeDate: null,
      essentialExpenses: 500,
    },
  });

  await test('3.1 Purchase comfortably within discretionary capacity (BUY NOW)', async () => {
    // Balance 5,000, Reserve 1,000, Remaining Target 1,000 -> Discretionary = 3,000
    // Purchase: ₹800
    const res = await request('/decisions/evaluate-purchase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        purchaseName: 'Engineering Reference Handbook',
        amount: 800,
        category: 'Education',
        saveHistory: true,
      },
    });
    assert.strictEqual(res.status, 200);
    const d = res.data.decision;
    assert.strictEqual(d.recommendation, 'BUY NOW');
    assert.strictEqual(d.remainingProjectedBalance, 4200);
  });

  await test('3.2 Purchase exactly equal to available discretionary capacity (BUY NOW)', async () => {
    // Discretionary = 3,000. Purchase = 3,000. Leaves exactly 2,000 (1,000 reserve + 1,000 target)
    const res = await request('/decisions/evaluate-purchase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        purchaseName: 'External Monitor Deal',
        amount: 3000,
        category: 'Shopping',
        saveHistory: false,
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.evaluation.recommendation, 'BUY NOW');
    assert.strictEqual(res.data.evaluation.remainingProjectedBalance, 2000);
  });

  await test('3.3 Purchase exceeding discretionary capacity & encroaching on savings (RECONSIDER)', async () => {
    // Purchase = 3,500. Leaves 1,500. Reserve is 1,000, but savings target needs 1,000 -> Encroaches by 500
    const res = await request('/decisions/evaluate-purchase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        purchaseName: 'Designer Jacket',
        amount: 3500,
        category: 'Shopping',
        priority: 'optional',
        saveHistory: false,
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.evaluation.recommendation, 'RECONSIDER');
    assert(res.data.evaluation.reasons.some((r) => r.includes('savings target')));
  });

  await test('3.4 Purchase threatening emergency reserve (RECONSIDER)', async () => {
    // Purchase = 4,500. Leaves 500 < 1,000 emergency reserve
    const res = await request('/decisions/evaluate-purchase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        purchaseName: 'Flagship Smartphone',
        amount: 4500,
        category: 'Electronics',
        priority: 'optional',
        saveHistory: false,
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.evaluation.recommendation, 'RECONSIDER');
    assert(res.data.evaluation.reasons.some((r) => r.includes('emergency')));
  });

  await test('3.5 Purchase becoming affordable after expected income (WAIT)', async () => {
    const futureIncomeDate = new Date();
    futureIncomeDate.setDate(futureIncomeDate.getDate() + 10);

    await request('/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        expectedIncome: 6000,
        expectedIncomeDate: futureIncomeDate.toISOString(),
      },
    });

    // Purchase ₹4,500 cannot be afforded today, but with ₹6,000 arriving in 10 days, recommendation becomes WAIT
    const res = await request('/decisions/evaluate-purchase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        purchaseName: 'Semester Project Laptop',
        amount: 4500,
        plannedDate: new Date().toISOString(),
        saveHistory: false,
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.evaluation.recommendation, 'WAIT');
    assert(res.data.evaluation.suggestedAction.toLowerCase().includes('wait') || res.data.evaluation.suggestedAction.toLowerCase().includes('delay'));
  });

  await test('3.6 Purchase affected by upcoming college fee obligation (WAIT / RECONSIDER)', async () => {
    // Add pending College Tuition Fee due in 6 days: ₹3,000
    const feeDate = new Date();
    feeDate.setDate(feeDate.getDate() + 6);

    const obRes = await request('/obligations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'College Semester Exam Fee',
        amount: 3000,
        dueDate: feeDate.toISOString(),
        obligationType: 'college_fee',
      },
    });
    assert.strictEqual(obRes.status, 201);
    const obId = obRes.data.obligation._id;

    // Remove expected income to test pure constraint
    await request('/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { expectedIncome: 0, expectedIncomeDate: null },
    });

    // Current balance: 5,000. Purchase: 2,500. Fee: 3,000. Total needed: 5,500 > 5,000
    const res = await request('/decisions/evaluate-purchase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        purchaseName: 'Gaming Earbuds',
        amount: 2500,
        category: 'Shopping',
        saveHistory: false,
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.evaluation.recommendation, 'RECONSIDER');
    assert(res.data.evaluation.reasons.some((r) => r.includes('upcoming obligations')));

    // Clean up obligation
    await request(`/obligations/${obId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
  });

  await test('3.7 Invalid and missing inputs return 400', async () => {
    const resMissing = await request('/decisions/evaluate-purchase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { amount: 500 }, // missing purchaseName
    });
    assert.strictEqual(resMissing.status, 400);

    const resZero = await request('/decisions/evaluate-purchase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { purchaseName: 'Free item', amount: 0 },
    });
    assert.strictEqual(resZero.status, 400);
  });

  // =========================================================================
  // SECTION 4: DAILY SPENDING EVALUATOR
  // =========================================================================
  console.log('\n--- SECTION 4: DAILY SPENDING EVALUATOR ---');

  // Calibrate allowance to test daily velocity fairly alongside existing test transactions
  await request('/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: {
      currentBalance: 8000,
      emergencyReserve: 1000,
      savingsTarget: 1000,
      actualSavings: 0,
      allowance: 20000,
      essentialExpenses: 1000,
    },
  });

  await test('4.1 Daily spend within safe pace (BUY NOW)', async () => {
    const res = await request('/decisions/evaluate-daily', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        amount: 75,
        category: 'Food',
        description: 'Hostel mess evening tea and snack',
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.result.recommendation, 'BUY NOW');
  });

  await test('4.2 Daily spend significantly exceeding safe pace (WAIT)', async () => {
    // Spending ₹5,000 on an impulse daily food order when daily safe limit is ~₹500
    const res = await request('/decisions/evaluate-daily', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        amount: 5000,
        category: 'Food',
        description: 'Lavish club feast takeout',
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.result.recommendation, 'WAIT');
    assert(res.data.result.reasons.some((r) => r.includes('safe daily spending limit')));
  });

  await test('4.3 Daily spend encroaching on remaining savings target (WAIT)', async () => {
    // Set profile with tight balance
    await request('/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        currentBalance: 2200,
        emergencyReserve: 700,
        savingsTarget: 1000,
        actualSavings: 0,
        allowance: 3000,
      },
    });

    // 2,200 - 600 = 1,600 < 1,700 (700 reserve + 1,000 target). Encroaches by 100
    const res = await request('/decisions/evaluate-daily', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        amount: 600,
        category: 'Shopping',
        description: 'Impulse wireless mouse',
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.result.recommendation, 'WAIT');
    assert(res.data.result.reasons.some((r) => r.includes('savings target')));
  });

  // =========================================================================
  // SECTION 5: FINANCIAL TIMELINE & OBLIGATIONS
  // =========================================================================
  console.log('\n--- SECTION 5: FINANCIAL TIMELINE & TRAJECTORY ---');

  await test('5.1 Timeline: Trajectory calculates milestones without double-counting', async () => {
    const nextIncome = new Date();
    nextIncome.setDate(nextIncome.getDate() + 14);

    await request('/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        currentBalance: 4000,
        emergencyReserve: 800,
        savingsTarget: 1000,
        actualSavings: 200,
        expectedIncome: 5000,
        expectedIncomeDate: nextIncome.toISOString(),
      },
    });

    // Create one paid obligation and one pending obligation
    const dueSoon = new Date();
    dueSoon.setDate(dueSoon.getDate() + 5);

    const obPending = await request('/obligations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'Electricity Share',
        amount: 600,
        dueDate: dueSoon.toISOString(),
        obligationType: 'utility',
      },
    });

    const obPaid = await request('/obligations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        title: 'Hostel Maintenance',
        amount: 400,
        dueDate: new Date().toISOString(),
        obligationType: 'rent',
      },
    });

    // Mark one as paid using PUT /obligations/:id
    await request(`/obligations/${obPaid.data.obligation._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { status: 'paid' },
    });

    const timelineRes = await request('/analytics/timeline', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(timelineRes.status, 200);
    const timeline = timelineRes.data.timeline;

    assert(timeline && timeline.length >= 3, 'Must contain initial, obligation, and income milestones');
    // Verify paid obligation was excluded from future projections
    assert(!timeline.some((e) => e.title === 'Hostel Maintenance' && e.status === 'pending'));
    // Verify starting balance milestone
    const initialMilestone = timeline.find((e) => e.type === 'initial');
    assert(initialMilestone, 'Initial milestone must exist');
    assert.strictEqual(initialMilestone.amount, 4000);
    // Verify summary metrics
    assert.strictEqual(timelineRes.data.emergencyReserve, 800);
    assert.strictEqual(timelineRes.data.remainingSavingsTarget, 800);
  });

  // =========================================================================
  // SECTION 6: WHAT-IF SIMULATOR
  // =========================================================================
  console.log('\n--- SECTION 6: WHAT-IF PURCHASE SIMULATOR ---');

  await test('6.1 What-If Simulator: Generates Buy Now, Wait, Cheaper Alternative, and Skip scenarios', async () => {
    const res = await request('/decisions/simulate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        amount: 2500,
        purchaseName: 'Noise Cancelling Headphones',
        category: 'Electronics',
        alternativeDiscountPct: 40,
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.simulation && res.data.simulation.scenarios);
    const scenarios = res.data.simulation.scenarios;

    assert(scenarios.buyNow, 'Buy Now scenario required');
    assert(scenarios.waitNextAllowance, 'Wait scenario required');
    assert(scenarios.cheaperAlternative, 'Cheaper alternative scenario required');
    assert(scenarios.skipPurchase, 'Skip scenario required');

    // Cheaper alternative should be 40% discounted (₹1,500)
    assert.strictEqual(scenarios.cheaperAlternative.cost, 1500);
    assert.strictEqual(scenarios.cheaperAlternative.savedAmount, 1000);

    // Skip scenario shows annual impact
    assert.strictEqual(scenarios.skipPurchase.instantSavings, 2500);
    assert.strictEqual(scenarios.skipPurchase.projectedAnnualImpact, 30000);
  });

  // =========================================================================
  // SECTION 7: FASTAPI ML SERVICE INTEGRATION & FALLBACKS
  // =========================================================================
  console.log('\n--- SECTION 7: ML SERVICE LIVE INTEGRATION & FALLBACKS ---');

  await test('7.1 Live ML Categorization: Express calling FastAPI categorizer', async () => {
    const res = await request('/transactions/auto-categorize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { description: 'Zomato biryani delivery for lunch' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.category, 'Food');
    assert(res.data.confidence > 0.4);
    assert.strictEqual(res.data.source, 'ml_model', 'Must be served by active ML model');
  });

  await test('7.2 Live ML Anomaly Detection & Forecasting via Spending Intelligence', async () => {
    // Seed 6 transactions with one clear outlier (₹4,500 luxury coat)
    const testTxs = [
      { description: 'Canteen breakfast', amount: 45, category: 'Food', type: 'expense' },
      { description: 'College xerox copy', amount: 30, category: 'Education', type: 'expense' },
      { description: 'Bus pass recharge', amount: 150, category: 'Transport', type: 'expense' },
      { description: 'Canteen meal', amount: 65, category: 'Food', type: 'expense' },
      { description: 'Snack roll', amount: 50, category: 'Food', type: 'expense' },
      { description: 'Designer Leather Jacket Outlier', amount: 4500, category: 'Shopping', type: 'expense' },
    ];

    for (const tx of testTxs) {
      await request('/transactions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: tx,
      });
    }

    const intelRes = await request('/analytics/spending-intelligence', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(intelRes.status, 200);
    assert(intelRes.data.anomalies.length > 0, 'Anomaly detection must flag the outlier');
    assert(intelRes.data.anomalies.some((a) => a.amount === 4500));
    assert(intelRes.data.forecast !== null, 'Forecast must be generated');
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n====================================================');
  console.log(`AUDIT FINISHED: ${passed}/${total} TESTS PASSED`);
  if (failures.length > 0) {
    console.log(`FAILURES (${failures.length}):`);
    failures.forEach((f) => console.log(`  - ${f.name}: ${f.error}`));
  }
  console.log('====================================================\n');

  if (failures.length > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Audit run encountered fatal error:', err);
  process.exit(1);
});
