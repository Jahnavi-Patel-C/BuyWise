import mongoose from 'mongoose';

const financialObligationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    obligationType: {
      type: String,
      enum: ['college_fee', 'rent', 'loan_or_emi', 'subscription', 'utility', 'other'],
      default: 'college_fee',
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

financialObligationSchema.index({ userId: 1, dueDate: 1 });

export default mongoose.model('FinancialObligation', financialObligationSchema);

