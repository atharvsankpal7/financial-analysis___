import mongoose, { Schema, Model } from 'mongoose';

export interface IGoldPrice {
  state: string;
  price: number;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoldPriceSchema = new Schema<IGoldPrice>(
  {
    state: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

GoldPriceSchema.index({ state: 1, date: -1 });
GoldPriceSchema.index({ date: -1 });

const GoldPrice: Model<IGoldPrice> =
  mongoose.models.GoldPrice || mongoose.model<IGoldPrice>('GoldPrice', GoldPriceSchema);

export default GoldPrice;
