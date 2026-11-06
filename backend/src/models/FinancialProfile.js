import mongoose from 'mongoose';

const financialProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    allowance: {
      type: Number,
      default: 0,
      min: [0, 'Allowance cannot be negative'],
    },
    allowanceFrequency: {
      type: String,
      enum: ['monthly', 'weekly'],
      default: 'monthly',
    },
    currentBalance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    expectedIncome: {
      type: Number,
      default: 0,
      min: [0, 'Expected income cannot be negative'],
    },
    expectedIncomeDate: {
      type: Date,
      default: null,
    },
    essentialExpenses: {
      type: Number,
      default: 0,
      min: [0, 'Essential expenses cannot be negative'],
    },
    savingsTarget: {
      type: Number,
      default: 0,
      min: [0, 'Savings target cannot be negative'],
    },
    actualSavings: {
      type: Number,
      default: 0,
      min: [0, 'Actual savings cannot be negative'],
    },
    totalAccumulatedSavings: {
      type: Number,
      default: 0,
      min: [0, 'Accumulated savings cannot be negative'],
    },
    currentCycleStart: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
      },
    },
    emergencyReserve: {
      type: Number,
      default: 500,
      min: [0, 'Emergency reserve cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('FinancialProfile', financialProfileSchema);

