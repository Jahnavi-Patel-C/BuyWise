import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import FinancialProfile from '../models/FinancialProfile.js';
import FinancialObligation from '../models/FinancialObligation.js';
import Transaction from '../models/Transaction.js';
import PurchaseDecision from '../models/PurchaseDecision.js';
import { connectDB } from '../config/db.js';

export async function seedDemoDataForUser(targetUser) {
  const userId = targetUser._id;

  // 1. Wipe existing data for this user
  await FinancialProfile.deleteMany({ userId });
  await FinancialObligation.deleteMany({ userId });
  await Transaction.deleteMany({ userId });
  await PurchaseDecision.deleteMany({ userId });

  const now = new Date();

  // 2. Financial Profile
  const incomeDate = new Date();
  incomeDate.setDate(incomeDate.getDate() + 10);

  const profile = await FinancialProfile.create({
    userId,
    allowance: 6000,
    allowanceFrequency: 'monthly',
    currentBalance: 4850,
    expectedIncome: 6000,
    expectedIncomeDate: incomeDate,
    essentialExpenses: 1500,
    savingsTarget: 1000,
    actualSavings: 400,
    emergencyReserve: 800,
  });

  // 3. Upcoming Obligations
  const examFeeDate = new Date();
  examFeeDate.setDate(examFeeDate.getDate() + 5);

  const wifiDate = new Date();
  wifiDate.setDate(wifiDate.getDate() + 14);

  const obligations = await FinancialObligation.create([
    {
      userId,
      title: 'Semester Lab & Exam Fee',
      amount: 2500,
      dueDate: examFeeDate,
      obligationType: 'college_fee',
      status: 'pending',
      notes: 'Mandatory college department exam registration',
    },
    {
      userId,
      title: 'Hostel WiFi & Electricity Share',
      amount: 450,
      dueDate: wifiDate,
      obligationType: 'utility',
      status: 'pending',
      notes: 'Monthly split with roommates',
    },
  ]);

  // 4. Realistic Student Transactions across the past 25 days
  const transactionsData = [
    // Income
    { description: 'Monthly Allowance from Parents', amount: 6000, type: 'income', category: 'Other', daysAgo: 22, method: 'Net Banking' },
    { description: 'Freelance Design Project', amount: 1500, type: 'income', category: 'Other', daysAgo: 10, method: 'UPI' },
    
    // Regular Food & Micro-purchases
    { description: 'Campus Canteen Lunch', amount: 85, type: 'expense', category: 'Food', daysAgo: 21, method: 'UPI' },
    { description: 'Chai & Samosa Stall', amount: 40, type: 'expense', category: 'Food', daysAgo: 20, method: 'Cash' },
    { description: 'Swiggy Dinner Biryani', amount: 260, type: 'expense', category: 'Food', daysAgo: 19, method: 'UPI' },
    { description: 'Canteen Cold Coffee', amount: 50, type: 'expense', category: 'Food', daysAgo: 18, method: 'UPI' },
    { description: 'Zomato Burger Combo', amount: 240, type: 'expense', category: 'Food', daysAgo: 17, method: 'UPI' },
    { description: 'Campus Nescafe Counter', amount: 35, type: 'expense', category: 'Food', daysAgo: 16, method: 'UPI' },
    { description: 'Swiggy Late Night Roll', amount: 190, type: 'expense', category: 'Food', daysAgo: 15, method: 'UPI' },
    { description: 'Canteen Meals', amount: 90, type: 'expense', category: 'Food', daysAgo: 14, method: 'Cash' },
    { description: 'Zomato Pizza Slice', amount: 280, type: 'expense', category: 'Food', daysAgo: 12, method: 'UPI' },
    { description: 'Chai & Maggi Break', amount: 55, type: 'expense', category: 'Food', daysAgo: 10, method: 'UPI' },
    { description: 'Swiggy Lunch Bowl', amount: 220, type: 'expense', category: 'Food', daysAgo: 8, method: 'UPI' },
    { description: 'College Canteen Dosa', amount: 70, type: 'expense', category: 'Food', daysAgo: 6, method: 'UPI' },
    { description: 'Zomato Shawarma', amount: 180, type: 'expense', category: 'Food', daysAgo: 4, method: 'UPI' },
    { description: 'Canteen Coffee & Sandwich', amount: 65, type: 'expense', category: 'Food', daysAgo: 1, method: 'UPI' },
    
    // Transport
    { description: 'Metro Smart Card Recharge', amount: 300, type: 'expense', category: 'Transport', daysAgo: 20, method: 'UPI' },
    { description: 'Rapido Bike to Coaching', amount: 45, type: 'expense', category: 'Transport', daysAgo: 18, method: 'UPI' },
    { description: 'Uber Auto with Classmates', amount: 80, type: 'expense', category: 'Transport', daysAgo: 13, method: 'UPI' },
    { description: 'Rapido Ride to Railway Station', amount: 65, type: 'expense', category: 'Transport', daysAgo: 7, method: 'UPI' },
    { description: 'Metro Pass Top-up', amount: 200, type: 'expense', category: 'Transport', daysAgo: 3, method: 'UPI' },

    // Groceries
    { description: 'Blinkit Milk, Bread & Oats', amount: 230, type: 'expense', category: 'Groceries', daysAgo: 19, method: 'UPI' },
    { description: 'Zepto Fruits & Snacks', amount: 185, type: 'expense', category: 'Groceries', daysAgo: 11, method: 'UPI' },
    { description: 'Local Supermarket Essentials', amount: 310, type: 'expense', category: 'Groceries', daysAgo: 5, method: 'Debit Card' },

    // Education
    { description: 'Engineering Mathematics Textbook', amount: 420, type: 'expense', category: 'Education', daysAgo: 21, method: 'UPI' },
    { description: 'Lab Manual Xerox & Binding', amount: 120, type: 'expense', category: 'Education', daysAgo: 14, method: 'Cash' },
    { description: 'Assignment Printouts', amount: 60, type: 'expense', category: 'Education', daysAgo: 9, method: 'Cash' },

    // Entertainment
    { description: 'Spotify Student Subscription', amount: 59, type: 'expense', category: 'Entertainment', daysAgo: 15, method: 'Debit Card' },
    { description: 'Movie Ticket with Friends', amount: 250, type: 'expense', category: 'Entertainment', daysAgo: 8, method: 'UPI' },

    // Bills
    { description: 'Jio Mobile 5G Recharge 28 Days', amount: 299, type: 'expense', category: 'Bills', daysAgo: 17, method: 'UPI' },

    // Healthcare
    { description: 'Pharmacy Cold & Flu Tablets', amount: 110, type: 'expense', category: 'Healthcare', daysAgo: 12, method: 'UPI' },

    // Unusual / Anomaly transaction (Noticeable outlier for student budget!)
    { description: 'Designer Sunglasses Impulse Buy', amount: 2600, type: 'expense', category: 'Shopping', daysAgo: 13, isAnomaly: true, method: 'Credit Card' },
  ];

  const transactionsToInsert = transactionsData.map((item) => {
    const tDate = new Date();
    tDate.setDate(tDate.getDate() - item.daysAgo);
    return {
      userId,
      description: item.description,
      amount: item.amount,
      type: item.type,
      category: item.category,
      date: tDate,
      paymentMethod: item.method || 'UPI',
      isAnomaly: item.isAnomaly || false,
    };
  });

  await Transaction.insertMany(transactionsToInsert);

  // 5. Pre-evaluated Purchase Decisions in History
  const decision1Date = new Date();
  decision1Date.setDate(decision1Date.getDate() - 3);

  const decision2Date = new Date();
  decision2Date.setDate(decision2Date.getDate() - 1);

  await PurchaseDecision.create([
    {
      userId,
      purchaseName: 'Wireless Gaming Headphones',
      amount: 3500,
      category: 'Electronics',
      plannedDate: decision1Date,
      priority: 'useful',
      description: 'Noise cancelling over-ear headphones',
      recommendation: 'WAIT',
      calculatedFinancialCapacity: 1200,
      remainingProjectedBalance: 1350,
      discretionaryCapacity: 1200,
      safetyReserve: 800,
      upcomingCommitmentsTotal: 2950,
      reasons: [
        'You have an upcoming college exam fee of ₹2,500 due in 5 days.',
        'Spending ₹3,500 today would leave only ₹1,350, risking your exam fee payment.',
        'With your ₹6,000 allowance arriving in 10 days, this purchase becomes safe after allowance.',
      ],
      suggestedAction: 'Wait 10 days until your allowance is deposited.',
      alternativeSuggestions: [
        { title: 'Budget Wired Earphones', description: 'Look for reliable alternatives under ₹999', potentialSavings: 2501 },
      ],
      createdAt: decision1Date,
    },
    {
      userId,
      purchaseName: 'Python for Data Science Bootcamp',
      amount: 799,
      category: 'Education',
      plannedDate: decision2Date,
      priority: 'essential',
      description: 'Certification course on sale',
      recommendation: 'BUY NOW',
      calculatedFinancialCapacity: 2100,
      remainingProjectedBalance: 4051,
      discretionaryCapacity: 2100,
      safetyReserve: 800,
      upcomingCommitmentsTotal: 2950,
      reasons: [
        'Current balance of ₹4,850 comfortably accommodates this purchase of ₹799.',
        'Even after reserving ₹2,500 for college exam fee and ₹800 emergency buffer, ₹1,550 remains free.',
      ],
      suggestedAction: 'Safe to purchase. High academic ROI for career growth.',
      alternativeSuggestions: [],
      createdAt: decision2Date,
    },
  ]);

  return { profile, obligations, transactionsCount: transactionsToInsert.length };
}

// Standalone execution script
async function runStandaloneSeed() {
  try {
    await connectDB();
    console.log('Seeding Demo Account...');

    const email = 'alex.student@buywise.edu';
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username: 'Alex Sharma',
        email,
        password: 'Password@123',
      });
      console.log(`Created new demo user: ${email}`);
    } else {
      console.log(`Using existing demo user: ${email}`);
    }

    const result = await seedDemoDataForUser(user);
    console.log(`Demo seed completed successfully!`);
    console.log(`- User: ${email}`);
    console.log(`- Password: Password@123`);
    console.log(`- Balance: ₹${result.profile.currentBalance}`);
    console.log(`- Transactions: ${result.transactionsCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

// If executed directly
if (process.argv[1]?.endsWith('seedDemoData.js')) {
  runStandaloneSeed();
}

