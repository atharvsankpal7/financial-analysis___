import mongoose, { Schema, Model } from 'mongoose';

export interface IAsset {
  uuid: string;
  symbol: string;
  name: string;
  category: 'stock' | 'gold';
  currentPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['stock', 'gold'],
      required: true,
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

AssetSchema.index({ symbol: 1, category: 1 });
AssetSchema.index({ name: 'text', symbol: 'text' });

const Asset: Model<IAsset> = mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);

export default Asset;
