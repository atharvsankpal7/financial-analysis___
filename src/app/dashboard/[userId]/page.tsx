"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, User } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { AdjustmentDialog } from "@/components/AdjustmentDialog";
import { PortfolioOverviewCards } from "@/components/dashboard/PortfolioOverviewCards";
import { PortfolioCharts } from "@/components/dashboard/PortfolioCharts";
import { HoldingsTable } from "@/components/dashboard/HoldingsTable";
import { StockBreakdownTable } from "@/components/dashboard/StockBreakdownTable";

interface PortfolioData {
  portfolio: {
    userId: string;
    allocations: Record<string, number>;
    goldAllocation: number;
    savingsAllocation: number;
    totalValue: number;
    distribution: {
      savings: number;
      gold: number;
      stocks: number;
    };
    unallocatedAmount: number;
  };
  marketData: {
    stocks: Array<{
      uuid: string;
      symbol: string;
      name: string;
      category: string;
      currentPrice: number;
    }>;
    goldPrice: number;
  };
  predictedReturns: {
    stocks: Record<string, number>;
    gold: number;
    savings: number;
  };
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [loading, setLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(
    null,
  );
  const [error, setError] = useState<string>("");
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);

  useEffect(() => {
    fetchPortfolioData();
  }, [userId]);

  const fetchPortfolioData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/portfolio/${userId}`);
      const data = await response.json();

      if (data.success) {
        setPortfolioData(data.data);
      } else {
        setError(data.message || "Failed to load portfolio");
      }
    } catch (error) {
      setError("An error occurred while loading portfolio data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
          <p className="text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !portfolioData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error || "Failed to load portfolio data"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const distributionData = [
    {
      name: "Savings",
      value: portfolioData.portfolio.savingsAllocation,
      percentage: portfolioData.portfolio.distribution.savings,
      color: "#10b981",
    },
    {
      name: "Gold",
      value: portfolioData.portfolio.goldAllocation,
      percentage: portfolioData.portfolio.distribution.gold,
      color: "#f59e0b",
    },
    {
      name: "Stocks",
      value: Object.values(portfolioData.portfolio.allocations).reduce(
        (sum, val) => sum + val,
        0,
      ),
      percentage: portfolioData.portfolio.distribution.stocks,
      color: "#3b82f6",
    },
  ];

  const holdingsData = [
    {
      asset: "Savings",
      currentValue: portfolioData.portfolio.savingsAllocation,
      allocation: portfolioData.portfolio.distribution.savings,
      predictedReturn: portfolioData.predictedReturns.savings,
    },
    {
      asset: "Gold (24K)",
      currentValue: portfolioData.portfolio.goldAllocation,
      allocation: portfolioData.portfolio.distribution.gold,
      predictedReturn: portfolioData.predictedReturns.gold,
    },
  ];

  portfolioData.marketData.stocks.forEach((stock) => {
    const allocation = portfolioData.portfolio.allocations[stock.uuid] || 0;
    if (allocation > 0) {
      holdingsData.push({
        asset: stock.name,
        currentValue: allocation,
        allocation: (allocation / portfolioData.portfolio.totalValue) * 100,
        predictedReturn: portfolioData.predictedReturns.stocks[stock.uuid] || 0,
      });
    }
  });

  const stockHoldings = portfolioData.marketData.stocks
    .filter(
      (stock) => (portfolioData.portfolio.allocations[stock.uuid] || 0) > 0,
    )
    .map((stock) => {
      const allocation = portfolioData.portfolio.allocations[stock.uuid];
      const quantity = allocation / stock.currentPrice;
      return {
        name: stock.name,
        symbol: stock.symbol,
        quantity: quantity,
        currentPrice: stock.currentPrice,
        currentValue: allocation,
        allocation: (allocation / portfolioData.portfolio.totalValue) * 100,
        predictedReturn: portfolioData.predictedReturns.stocks[stock.uuid] || 0,
      };
    });

  const investmentAllocation =
    portfolioData.portfolio.goldAllocation +
    Object.values(portfolioData.portfolio.allocations).reduce(
      (sum, val) => sum + val,
      0,
    );

  const investmentPercentage =
    portfolioData.portfolio.distribution.gold +
    portfolioData.portfolio.distribution.stocks;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Portfolio Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Track and manage your investments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/profile/${userId}`)}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button onClick={() => setAdjustmentDialogOpen(true)}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Adjust Investments
            </Button>
          </div>
        </div>

        {portfolioData.portfolio.unallocatedAmount > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-900">
                  Unallocated Amount Available
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You have{" "}
                  {formatCurrency(portfolioData.portfolio.unallocatedAmount)}{" "}
                  that is not allocated in your portfolio. Use the "Adjust
                  Investments" button to allocate these funds.
                </p>
              </div>
              <div className="text-2xl font-bold text-yellow-900">
                {formatCurrency(portfolioData.portfolio.unallocatedAmount)}
              </div>
            </div>
          </div>
        )}

        <PortfolioOverviewCards
          totalValue={portfolioData.portfolio.totalValue}
          savingsAllocation={portfolioData.portfolio.savingsAllocation}
          savingsPercentage={portfolioData.portfolio.distribution.savings}
          investmentAllocation={investmentAllocation}
          investmentPercentage={investmentPercentage}
        />

        <PortfolioCharts distributionData={distributionData} />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stocks">Stock Breakdown</TabsTrigger>
            <TabsTrigger value="gold">Gold</TabsTrigger>
            <TabsTrigger value="savings">Savings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Holdings</CardTitle>
                <CardDescription>
                  Complete breakdown of your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HoldingsTable holdings={holdingsData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stocks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stock Holdings</CardTitle>
                <CardDescription>
                  Detailed view of your stock investments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StockBreakdownTable holdings={stockHoldings} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gold" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gold Investment</CardTitle>
                <CardDescription>Your gold allocation details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Current Gold Price (per gram)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(portfolioData.marketData.goldPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Gold Allocation
                    </span>
                    <span className="font-medium">
                      {formatCurrency(portfolioData.portfolio.goldAllocation)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Approximate Quantity
                    </span>
                    <span className="font-medium">
                      {(
                        portfolioData.portfolio.goldAllocation /
                        portfolioData.marketData.goldPrice
                      ).toFixed(2)}{" "}
                      grams
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Predicted Annual Return
                    </span>
                    <span className="font-medium text-green-600">
                      {formatPercentage(portfolioData.predictedReturns.gold)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="savings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Savings Account</CardTitle>
                <CardDescription>Your safe savings allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Savings
                    </span>
                    <span className="font-medium">
                      {formatCurrency(
                        portfolioData.portfolio.savingsAllocation,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Annual Interest Rate
                    </span>
                    <span className="font-medium">
                      {formatPercentage(portfolioData.predictedReturns.savings)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Expected Annual Interest
                    </span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(
                        (portfolioData.portfolio.savingsAllocation *
                          portfolioData.predictedReturns.savings) /
                          100,
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        userId={userId}
        onSuccess={fetchPortfolioData}
      />
    </div>
  );
}
