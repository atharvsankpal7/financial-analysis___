import mongoose, { Schema, Model } from "mongoose";

export interface IOnboardingData {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  location: {
    state: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    country: string;
  };
  initialInvestmentAmount: number;
  savingsThreshold: {
    type: "percentage" | "fixed";
    value: number;
  };
  annualSavingsInterestRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingDataSchema = new Schema<IOnboardingData>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      state: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
      country: {
        type: String,
        required: true,
        default: "India",
      },
    },
    initialInvestmentAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    savingsThreshold: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true,
      },
      value: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    annualSavingsInterestRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  },
);

const OnboardingData: Model<IOnboardingData> =
  mongoose.models.OnboardingData ||
  mongoose.model<IOnboardingData>("OnboardingData", OnboardingDataSchema);

export default OnboardingData;
