export interface Location {
  state: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  country: string;
}

export interface SavingsThreshold {
  type: 'percentage' | 'fixed';
  value: number;
}

export interface User {
  _id: string;
  fullName: string;
  location: Location;
  initialInvestmentAmount: number;
  savingsThreshold: SavingsThreshold;
  annualSavingsInterestRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  _id: string;
  uuid: string;
  symbol: string;
  name: string;
  category: 'stock' | 'gold';
  currentPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPortfolio {
  _id: string;
  userId: string;
  selectedStockIds: string[];
  allocations: Record<string, number>;
  goldAllocation: number;
  savingsAllocation: number;
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoldPrice {
  _id: string;
  state: string;
  price: number;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PredictedReturns {
  stocks: Record<string, number>;
  gold: number;
  savings: number;
}

export interface PortfolioDistribution {
  savings: number;
  gold: number;
  stocks: number;
}

export interface PortfolioData {
  portfolio: {
    userId: string;
    allocations: Record<string, number>;
    goldAllocation: number;
    savingsAllocation: number;
    totalValue: number;
    distribution: PortfolioDistribution;
  };
  marketData: {
    stocks: Asset[];
    goldPrice: number;
  };
  predictedReturns: PredictedReturns;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ProposedAllocations {
  [key: string]: number;
}

export interface AdjustmentData {
  disposableAmount: number;
  currentAllocations: Record<string, number>;
  predictedReturns: PredictedReturns;
}
