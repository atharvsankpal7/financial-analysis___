"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface AdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

interface AdjustmentData {
  totalInvestment: number;
  safeSavings: number;
  currentAllocations: Record<string, number>;
  currentSavings: number;
  predictedReturns: {
    stocks: Record<string, number>;
    gold: number;
    savings: number;
  };
  stockMetadata: Record<string, { name: string; symbol: string }>;
}

export function AdjustmentDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: AdjustmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [adjustmentData, setAdjustmentData] = useState<AdjustmentData | null>(
    null,
  );
  const [changeAmounts, setChangeAmounts] = useState<Record<string, number>>(
    {},
  );
  const [finalAmounts, setFinalAmounts] = useState<Record<string, number>>({});
  const [savingsChange, setSavingsChange] = useState<number>(0);
  const [savingsFinal, setSavingsFinal] = useState<number>(0);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (open) {
      fetchAdjustmentData();
    }
  }, [open, userId]);

  const fetchAdjustmentData = async () => {
    setFetching(true);
    setError("");
    try {
      const response = await fetch(`/api/portfolio/${userId}/predictions`);
      const data = await response.json();

      if (data.success) {
        const totalInvestment = data.data.totalInvestment;
        const safeSavings = data.data.safeSavings;
        const currentSavings = data.data.currentSavings;
        const currentAllocations = { ...data.data.currentAllocations };

        setAdjustmentData({
          totalInvestment,
          safeSavings,
          currentAllocations,
          currentSavings,
          predictedReturns: data.data.predictedReturns,
          stockMetadata: data.data.stockMetadata || {},
        });

        const initialChanges: Record<string, number> = {};
        const initialFinals: Record<string, number> = {};
        for (const key in currentAllocations) {
          initialChanges[key] = 0;
          initialFinals[key] = currentAllocations[key];
        }
        setChangeAmounts(initialChanges);
        setFinalAmounts(initialFinals);
        setSavingsChange(0);
        setSavingsFinal(currentSavings);
      } else {
        setError(data.message || "Failed to load adjustment data");
      }
    } catch (error) {
      setError("An error occurred while loading data");
    } finally {
      setFetching(false);
    }
  };

  const handleChangeAmount = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const current =
      key === "savings"
        ? adjustmentData!.currentSavings
        : adjustmentData!.currentAllocations[key];
    const newFinal = current + numValue;

    if (key === "savings") {
      setSavingsChange(numValue);
      setSavingsFinal(newFinal);
    } else {
      setChangeAmounts({
        ...changeAmounts,
        [key]: numValue,
      });
      setFinalAmounts({
        ...finalAmounts,
        [key]: newFinal,
      });
    }
  };

  const handleFinalAmount = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const current =
      key === "savings"
        ? adjustmentData!.currentSavings
        : adjustmentData!.currentAllocations[key];
    const newChange = numValue - current;

    if (key === "savings") {
      setSavingsChange(newChange);
      setSavingsFinal(numValue);
    } else {
      setChangeAmounts({
        ...changeAmounts,
        [key]: newChange,
      });
      setFinalAmounts({
        ...finalAmounts,
        [key]: numValue,
      });
    }
  };

  const calculateRemaining = (): number => {
    if (!adjustmentData) return 0;
    const investmentTotal = Object.values(finalAmounts).reduce(
      (sum, val) => sum + val,
      0,
    );
    return adjustmentData.totalInvestment - savingsFinal - investmentTotal;
  };

  const handleSave = async () => {
    const remaining = calculateRemaining();

    // Check if over-allocated (negative remaining)
    if (remaining < -0.01) {
      setError("Total allocations exceed available investment amount");
      return;
    }

    // Remaining positive amount is allowed - it becomes unallocated

    if (adjustmentData && savingsFinal < adjustmentData.safeSavings) {
      setError(
        `Savings cannot be less than safe savings amount of ${formatCurrency(adjustmentData.safeSavings)}`,
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/portfolio/${userId}/adjust`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedAllocations: finalAmounts,
          proposedSavings: savingsFinal,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onOpenChange(false);
      } else {
        setError(data.message || "Failed to adjust portfolio");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (adjustmentData) {
      const resetChanges: Record<string, number> = {};
      const resetFinals: Record<string, number> = {};
      for (const key in adjustmentData.currentAllocations) {
        resetChanges[key] = 0;
        resetFinals[key] = adjustmentData.currentAllocations[key];
      }
      setChangeAmounts(resetChanges);
      setFinalAmounts(resetFinals);
      setSavingsChange(0);
      setSavingsFinal(adjustmentData.currentSavings);
    }
  };

  const remaining = calculateRemaining();
  const unallocatedAmount = remaining > 0 ? remaining : 0;
  const isValid =
    remaining >= -0.01 &&
    (adjustmentData ? savingsFinal >= adjustmentData.safeSavings : false);

  const getChangeIndicator = (change: number) => {
    if (Math.abs(change) < 0.01) {
      return (
        <span className="flex items-center text-gray-500">
          <Minus className="h-4 w-4 mr-1" />
          No Change
        </span>
      );
    } else if (change > 0) {
      return (
        <span className="flex items-center text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          Adding {formatCurrency(change)}
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-red-600">
          <TrendingDown className="h-4 w-4 mr-1" />
          Removing {formatCurrency(Math.abs(change))}
        </span>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adjust Your Investment Portfolio</DialogTitle>
          <DialogDescription>
            Modify your allocations with clear visibility of changes
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : adjustmentData ? (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-600">
                    Total Investment:
                  </span>
                  <div className="text-lg font-bold">
                    {formatCurrency(adjustmentData.totalInvestment)}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">
                    Safe Savings (Minimum):
                  </span>
                  <div className="text-sm font-medium">
                    {formatCurrency(adjustmentData.safeSavings)}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">
                    Remaining to Allocate:
                  </span>
                  <div
                    className={`text-lg font-bold ${
                      remaining < -0.01
                        ? "text-red-600"
                        : remaining > 0.01
                          ? "text-orange-600"
                          : "text-green-600"
                    }`}
                  >
                    {formatCurrency(remaining)}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">
                    Unallocated Amount:
                  </span>
                  <div
                    className={`text-lg font-bold ${
                      unallocatedAmount > 0 ? "text-blue-600" : "text-gray-600"
                    }`}
                  >
                    {formatCurrency(unallocatedAmount)}
                  </div>
                </div>
              </div>
            </div>

            {unallocatedAmount > 0.01 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> You have{" "}
                  {formatCurrency(unallocatedAmount)} that will remain
                  unallocated. You can allocate this amount later or leave it as
                  reserve funds.
                </p>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Adjustment Overview</CardTitle>
                <CardDescription>
                  Edit Change or Final amounts to adjust your portfolio. Any
                  unallocated amount will be saved as reserve funds.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Asset</TableHead>
                        <TableHead className="text-right">
                          Current Amount
                        </TableHead>
                        <TableHead className="text-center w-[200px]">
                          Change Amount
                        </TableHead>
                        <TableHead className="text-center w-[200px]">
                          Status
                        </TableHead>
                        <TableHead className="text-right w-[180px]">
                          Final Amount
                        </TableHead>
                        <TableHead className="text-right">
                          Predicted Return
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-green-50">
                        <TableCell className="font-semibold">Savings</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(adjustmentData.currentSavings)}
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500 text-sm">
                              ₹
                            </span>
                            <Input
                              type="number"
                              className="pl-8 text-center"
                              value={savingsChange}
                              onChange={(e) =>
                                handleChangeAmount("savings", e.target.value)
                              }
                              placeholder="0"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {getChangeIndicator(savingsChange)}
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500 text-sm">
                              ₹
                            </span>
                            <Input
                              type="number"
                              className="pl-8 text-right font-medium"
                              value={savingsFinal}
                              onChange={(e) =>
                                handleFinalAmount("savings", e.target.value)
                              }
                              min={adjustmentData.safeSavings}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatPercentage(
                            adjustmentData.predictedReturns.savings,
                          )}
                        </TableCell>
                      </TableRow>

                      {Object.entries(adjustmentData.currentAllocations).map(
                        ([key, currentValue]) => {
                          const metadata = adjustmentData.stockMetadata[key];
                          const displayName =
                            key === "gold"
                              ? "Gold"
                              : metadata
                                ? `${metadata.name} (${metadata.symbol})`
                                : `Stock (${key.substring(0, 8)}...)`;
                          const predictedReturn =
                            key === "gold"
                              ? adjustmentData.predictedReturns.gold
                              : adjustmentData.predictedReturns.stocks[key] ||
                                0;

                          return (
                            <TableRow key={key}>
                              <TableCell className="font-medium">
                                {displayName}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(currentValue)}
                              </TableCell>
                              <TableCell>
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-gray-500 text-sm">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    className="pl-8 text-center"
                                    value={changeAmounts[key] || 0}
                                    onChange={(e) =>
                                      handleChangeAmount(key, e.target.value)
                                    }
                                    placeholder="0"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {getChangeIndicator(changeAmounts[key] || 0)}
                              </TableCell>
                              <TableCell>
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-gray-500 text-sm">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    className="pl-8 text-right font-medium"
                                    value={finalAmounts[key] || 0}
                                    onChange={(e) =>
                                      handleFinalAmount(key, e.target.value)
                                    }
                                    min={0}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                {formatPercentage(predictedReturn)}
                              </TableCell>
                            </TableRow>
                          );
                        },
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            Failed to load adjustment data
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading || fetching}
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || fetching || !isValid}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Confirm Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
