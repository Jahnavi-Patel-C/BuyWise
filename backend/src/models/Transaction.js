import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      default: 'expense',
      required: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Other',
      enum: [
        'Food',
        'Transport',
        'Shopping',
        'Education',
        'Entertainment',
        'Bills',
        'Healthcare',
        'Groceries',
        'Savings',
        'Other',
      ],
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Debit Card', 'Credit Card', 'Cash', 'Net Banking', 'Other'],
      default: 'UPI',
    },
    isAnomaly: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient user transaction range queries
transactionSchema.index({ userId: 1, date: -1 });

export default mongoose.model('Transaction', transactionSchema);

