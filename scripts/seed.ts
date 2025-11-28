import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/financial_analysis';

interface IAsset {
  uuid: string;
  symbol: string;
  name: string;
  category: 'stock' | 'gold';
  currentPrice: number;
}

const AssetSchema = new mongoose.Schema<IAsset>(
  {
    uuid: { type: String, required: true, unique: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['stock', 'gold'], required: true },
    currentPrice: { type: Number, required: true },
  },
  { timestamps: true }
);

const Asset = mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);

interface IGoldPrice {
  state: string;
  price: number;
  date: string;
}

const GoldPriceSchema = new mongoose.Schema<IGoldPrice>(
  {
    state: { type: String, required: true },
    price: { type: Number, required: true },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

const GoldPrice = mongoose.models.GoldPrice || mongoose.model<IGoldPrice>('GoldPrice', GoldPriceSchema);

const indianStocks = [
  { uuid: crypto.randomUUID(), symbol: 'TCS.NS', name: 'Tata Consultancy Services', category: 'stock', currentPrice: 3850.50 },
  { uuid: crypto.randomUUID(), symbol: 'INFY.NS', name: 'Infosys Limited', category: 'stock', currentPrice: 1450.75 },
  { uuid: crypto.randomUUID(), symbol: 'RELIANCE.NS', name: 'Reliance Industries', category: 'stock', currentPrice: 2456.30 },
  { uuid: crypto.randomUUID(), symbol: 'HDFCBANK.NS', name: 'HDFC Bank', category: 'stock', currentPrice: 1650.20 },
  { uuid: crypto.randomUUID(), symbol: 'ICICIBANK.NS', name: 'ICICI Bank', category: 'stock', currentPrice: 1120.45 },
  { uuid: crypto.randomUUID(), symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', category: 'stock', currentPrice: 2380.60 },
  { uuid: crypto.randomUUID(), symbol: 'ITC.NS', name: 'ITC Limited', category: 'stock', currentPrice: 445.80 },
  { uuid: crypto.randomUUID(), symbol: 'SBIN.NS', name: 'State Bank of India', category: 'stock', currentPrice: 625.90 },
  { uuid: crypto.randomUUID(), symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', category: 'stock', currentPrice: 1540.25 },
  { uuid: crypto.randomUUID(), symbol: 'WIPRO.NS', name: 'Wipro Limited', category: 'stock', currentPrice: 485.35 },
  { uuid: crypto.randomUUID(), symbol: 'ASIANPAINT.NS', name: 'Asian Paints', category: 'stock', currentPrice: 2890.70 },
  { uuid: crypto.randomUUID(), symbol: 'MARUTI.NS', name: 'Maruti Suzuki India', category: 'stock', currentPrice: 12450.40 },
  { uuid: crypto.randomUUID(), symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', category: 'stock', currentPrice: 1780.55 },
  { uuid: crypto.randomUUID(), symbol: 'LT.NS', name: 'Larsen & Toubro', category: 'stock', currentPrice: 3620.80 },
  { uuid: crypto.randomUUID(), symbol: 'AXISBANK.NS', name: 'Axis Bank', category: 'stock', currentPrice: 1085.30 },
  { uuid: crypto.randomUUID(), symbol: 'TITAN.NS', name: 'Titan Company', category: 'stock', currentPrice: 3280.95 },
  { uuid: crypto.randomUUID(), symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', category: 'stock', currentPrice: 1680.40 },
  { uuid: crypto.randomUUID(), symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', category: 'stock', currentPrice: 6850.75 },
  { uuid: crypto.randomUUID(), symbol: 'HCLTECH.NS', name: 'HCL Technologies', category: 'stock', currentPrice: 1820.60 },
  { uuid: crypto.randomUUID(), symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement', category: 'stock', currentPrice: 10250.30 },
  { uuid: crypto.randomUUID(), symbol: 'TECHM.NS', name: 'Tech Mahindra', category: 'stock', currentPrice: 1650.85 },
  { uuid: crypto.randomUUID(), symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corporation', category: 'stock', currentPrice: 245.60 },
  { uuid: crypto.randomUUID(), symbol: 'NTPC.NS', name: 'NTPC Limited', category: 'stock', currentPrice: 365.45 },
  { uuid: crypto.randomUUID(), symbol: 'POWERGRID.NS', name: 'Power Grid Corporation', category: 'stock', currentPrice: 315.70 },
  { uuid: crypto.randomUUID(), symbol: 'TATAMOTORS.NS', name: 'Tata Motors', category: 'stock', currentPrice: 785.90 },
  { uuid: crypto.randomUUID(), symbol: 'M&M.NS', name: 'Mahindra & Mahindra', category: 'stock', currentPrice: 2680.40 },
  { uuid: crypto.randomUUID(), symbol: 'ADANIPORTS.NS', name: 'Adani Ports', category: 'stock', currentPrice: 1285.55 },
  { uuid: crypto.randomUUID(), symbol: 'JSWSTEEL.NS', name: 'JSW Steel', category: 'stock', currentPrice: 925.80 },
  { uuid: crypto.randomUUID(), symbol: 'TATASTEEL.NS', name: 'Tata Steel', category: 'stock', currentPrice: 165.35 },
  { uuid: crypto.randomUUID(), symbol: 'COALINDIA.NS', name: 'Coal India', category: 'stock', currentPrice: 425.65 },
  { uuid: crypto.randomUUID(), symbol: 'DRREDDY.NS', name: 'Dr. Reddy\'s Laboratories', category: 'stock', currentPrice: 5850.90 },
  { uuid: crypto.randomUUID(), symbol: 'CIPLA.NS', name: 'Cipla Limited', category: 'stock', currentPrice: 1480.25 },
  { uuid: crypto.randomUUID(), symbol: 'DIVISLAB.NS', name: 'Divi\'s Laboratories', category: 'stock', currentPrice: 5620.75 },
  { uuid: crypto.randomUUID(), symbol: 'BRITANNIA.NS', name: 'Britannia Industries', category: 'stock', currentPrice: 4850.40 },
  { uuid: crypto.randomUUID(), symbol: 'NESTLEIND.NS', name: 'Nestle India', category: 'stock', currentPrice: 2450.80 },
  { uuid: crypto.randomUUID(), symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank', category: 'stock', currentPrice: 985.60 },
  { uuid: crypto.randomUUID(), symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', category: 'stock', currentPrice: 1620.35 },
  { uuid: crypto.randomUUID(), symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp', category: 'stock', currentPrice: 4580.90 },
  { uuid: crypto.randomUUID(), symbol: 'GRASIM.NS', name: 'Grasim Industries', category: 'stock', currentPrice: 2385.45 },
  { uuid: crypto.randomUUID(), symbol: 'ADANIENT.NS', name: 'Adani Enterprises', category: 'stock', currentPrice: 2850.70 },
];

const indianStates = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Clearing existing data...');
    await Asset.deleteMany({});
    await GoldPrice.deleteMany({});
    console.log('Existing data cleared');

    console.log('Seeding stocks...');
    await Asset.insertMany(indianStocks);
    console.log(`Seeded ${indianStocks.length} stocks`);

    console.log('Seeding gold prices...');
    const today = new Date().toISOString().split('T')[0];
    const goldPrices = indianStates.map(state => ({
      state,
      price: 6000 + Math.random() * 500,
      date: today,
    }));
    await GoldPrice.insertMany(goldPrices);
    console.log(`Seeded gold prices for ${goldPrices.length} states`);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

seedDatabase()
  .then(() => {
    console.log('Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
