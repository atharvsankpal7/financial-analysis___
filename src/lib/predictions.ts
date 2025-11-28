import { PredictedReturns } from './types';

export function calculatePredictedReturns(
  stockAllocations: Record<string, number>,
  goldAllocation: number,
  savingsAllocation: number,
  annualSavingsRate: number
): PredictedReturns {
  const stockReturns: Record<string, number> = {};

  for (const uuid in stockAllocations) {
    stockReturns[uuid] = calculateStockReturn(uuid);
  }

  const goldReturn = calculateGoldReturn();
  const savingsReturn = annualSavingsRate;

  return {
    stocks: stockReturns,
    gold: goldReturn,
    savings: savingsReturn,
  };
}

export function calculateStockReturn(stockUuid: string): number {
  const historicalReturns: Record<string, number> = {
    default: 12.5,
  };

  return historicalReturns[stockUuid] || historicalReturns.default;
}

export function calculateGoldReturn(): number {
  return 8.0;
}

export function calculateProjectedValue(
  currentAmount: number,
  annualReturnRate: number,
  years: number = 1
): number {
  return currentAmount * Math.pow(1 + annualReturnRate / 100, years);
}

export function calculateTotalProjectedReturn(
  allocations: Record<string, number>,
  goldAllocation: number,
  savingsAllocation: number,
  predictedReturns: PredictedReturns
): number {
  let totalReturn = 0;

  for (const uuid in allocations) {
    const allocation = allocations[uuid];
    const returnRate = predictedReturns.stocks[uuid] || 0;
    totalReturn += (allocation * returnRate) / 100;
  }

  totalReturn += (goldAllocation * predictedReturns.gold) / 100;
  totalReturn += (savingsAllocation * predictedReturns.savings) / 100;

  return totalReturn;
}

export function calculateAbsoluteReturns(
  allocations: Record<string, number>,
  goldAllocation: number,
  savingsAllocation: number,
  predictedReturns: PredictedReturns
): {
  stocks: Record<string, number>;
  gold: number;
  savings: number;
  total: number;
} {
  const stockReturns: Record<string, number> = {};
  let totalStockReturns = 0;

  for (const uuid in allocations) {
    const allocation = allocations[uuid];
    const returnRate = predictedReturns.stocks[uuid] || 0;
    const absoluteReturn = (allocation * returnRate) / 100;
    stockReturns[uuid] = absoluteReturn;
    totalStockReturns += absoluteReturn;
  }

  const goldReturn = (goldAllocation * predictedReturns.gold) / 100;
  const savingsReturn = (savingsAllocation * predictedReturns.savings) / 100;

  return {
    stocks: stockReturns,
    gold: goldReturn,
    savings: savingsReturn,
    total: totalStockReturns + goldReturn + savingsReturn,
  };
}
