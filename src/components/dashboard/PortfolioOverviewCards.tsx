'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Wallet, TrendingUp } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface PortfolioOverviewCardsProps {
  totalValue: number;
  savingsAllocation: number;
  savingsPercentage: number;
  investmentAllocation: number;
  investmentPercentage: number;
}

export function PortfolioOverviewCards({
  totalValue,
  savingsAllocation,
  savingsPercentage,
  investmentAllocation,
  investmentPercentage,
}: PortfolioOverviewCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Savings Allocation</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(savingsAllocation)}</div>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(savingsPercentage)} of portfolio
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Investment Allocation</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(investmentAllocation)}</div>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(investmentPercentage)} of portfolio
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
