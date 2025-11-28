import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function calculateSafeSavings(
  initialInvestment: number,
  threshold: { type: 'percentage' | 'fixed'; value: number }
): number {
  if (threshold.type === 'percentage') {
    return (initialInvestment * threshold.value) / 100;
  }
  return threshold.value;
}

export function calculateDisposableAmount(
  totalInvestment: number,
  safeSavings: number
): number {
  return totalInvestment - safeSavings;
}

export function calculateTotalValue(
  allocations: Record<string, number>,
  goldAllocation: number,
  savingsAllocation: number
): number {
  const stocksTotal = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  return stocksTotal + goldAllocation + savingsAllocation;
}

export function calculateDistribution(
  allocations: Record<string, number>,
  goldAllocation: number,
  savingsAllocation: number
): { savings: number; gold: number; stocks: number } {
  const total = calculateTotalValue(allocations, goldAllocation, savingsAllocation);

  if (total === 0) {
    return { savings: 0, gold: 0, stocks: 0 };
  }

  const stocksTotal = Object.values(allocations).reduce((sum, val) => sum + val, 0);

  return {
    savings: (savingsAllocation / total) * 100,
    gold: (goldAllocation / total) * 100,
    stocks: (stocksTotal / total) * 100,
  };
}
