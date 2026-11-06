import mongoose from 'mongoose';

const purchaseDecisionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    purchaseName: {
      type: String,
      required: [true, 'Purchase name is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: true,
      default: 'Shopping',
    },
    plannedDate: {
      type: Date,
      default: Date.now,
    },
    priority: {
      type: String,
      enum: ['essential', 'useful', 'optional'],
      default: 'useful',
    },
    description: {
      type: String,
      default: '',
    },
    recommendation: {
      type: String,
      enum: ['BUY NOW', 'WAIT', 'RECONSIDER'],
      required: true,
    },
    calculatedFinancialCapacity: {
      type: Number,
      required: true,
    },
    remainingProjectedBalance: {
      type: Number,
      required: true,
    },
    discretionaryCapacity: {
      type: Number,
      required: true,
    },
    safetyReserve: {
      type: Number,
      default: 0,
    },
    upcomingCommitmentsTotal: {
      type: Number,
      default: 0,
    },
    reasons: {
      type: [String],
      default: [],
    },
    suggestedAction: {
      type: String,
      default: '',
    },
    alternativeSuggestions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    mlAssessment: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

purchaseDecisionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('PurchaseDecision', purchaseDecisionSchema);

