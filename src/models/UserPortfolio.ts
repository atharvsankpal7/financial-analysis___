import mongoose, { Schema, Model } from 'mongoose';

export interface IUserPortfolio {
  userId: mongoose.Types.ObjectId;
  selectedStockIds: string[];
  allocations: Record<string, number>;
  goldAllocation: number;
  savingsAllocation: number;
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserPortfolioSchema = new Schema<IUserPortfolio>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    selectedStockIds: {
      type: [String],
      default: [],
    },
    allocations: {
      type: Map,
      of: Number,
      default: {},
    },
    goldAllocation: {
      type: Number,
      default: 0,
      min: 0,
    },
    savingsAllocation: {
      type: Number,
      default: 0,
      min: 0,
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const UserPortfolio: Model<IUserPortfolio> =
  mongoose.models.UserPortfolio || mongoose.model<IUserPortfolio>('UserPortfolio', UserPortfolioSchema);

export default UserPortfolio;
