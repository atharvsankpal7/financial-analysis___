"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";

interface Stock {
  uuid: string;
  symbol: string;
  name: string;
  category: string;
  currentPrice: number;
}

export default function SelectStocksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingStocks, setFetchingStocks] = useState(true);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStockIds, setSelectedStockIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    setFetchingStocks(true);
    try {
      const response = await fetch("/api/assets/stocks");
      const data = await response.json();

      if (Array.isArray(data)) {
        setStocks(data);
      } else {
        setErrors({ fetch: "Failed to load stocks" });
      }
    } catch (error) {
      setErrors({ fetch: "An error occurred while loading stocks" });
    } finally {
      setFetchingStocks(false);
    }
  };

  const filteredStocks = stocks.filter((stock) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      stock.name.toLowerCase().includes(query) ||
      stock.symbol.toLowerCase().includes(query)
    );
  });

  const toggleStock = (uuid: string) => {
    const newSelected = new Set(selectedStockIds);
    if (newSelected.has(uuid)) {
      newSelected.delete(uuid);
    } else {
      newSelected.add(uuid);
    }
    setSelectedStockIds(newSelected);
  };

  const selectAll = () => {
    setSelectedStockIds(new Set(stocks.map((stock) => stock.uuid)));
  };

  const clearAll = () => {
    setSelectedStockIds(new Set());
  };

  const handleSubmit = async () => {
    if (selectedStockIds.size === 0) {
      setErrors({ submit: "Please select at least one stock" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/onboarding/select-stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedStockIds: Array.from(selectedStockIds),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Use userId from API response
        const userId = data.data?.userId;
        if (userId) {
          router.push(`/dashboard/${userId}`);
        } else {
          router.push("/dashboard");
        }
      } else {
        setErrors({ submit: data.message || "Failed to save stock selection" });
      }
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Progress value={100} className="h-2" />
          <p className="text-sm text-gray-600 mt-2">Step 2 of 2</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Your Investment Interests</CardTitle>
            <CardDescription>
              Choose the stocks you are interested in investing in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {errors.fetch && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.fetch}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedStockIds.size} stock
                  {selectedStockIds.size !== 1 ? "s" : ""} selected
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    disabled={fetchingStocks}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    disabled={fetchingStocks}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <Command className="rounded-lg border">
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <input
                    placeholder="Search stocks by name or symbol..."
                    className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[400px]">
                  <CommandList>
                    {fetchingStocks ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : filteredStocks.length === 0 ? (
                      <CommandEmpty>No stocks found.</CommandEmpty>
                    ) : (
                      <div className="p-2">
                        {filteredStocks.map((stock) => (
                          <CommandItem
                            key={stock.uuid}
                            className="flex items-center space-x-3 p-3 cursor-pointer"
                            onSelect={() => toggleStock(stock.uuid)}
                          >
                            <Checkbox
                              checked={selectedStockIds.has(stock.uuid)}
                              onCheckedChange={() => toggleStock(stock.uuid)}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{stock.name}</div>
                              <div className="text-sm text-gray-500">
                                {stock.symbol}
                              </div>
                            </div>
                            <div className="text-sm font-medium">
                              ₹{stock.currentPrice.toFixed(2)}
                            </div>
                          </CommandItem>
                        ))}
                      </div>
                    )}
                  </CommandList>
                </ScrollArea>
              </Command>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || selectedStockIds.size === 0}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finishing...
                    </>
                  ) : (
                    "Finish Setup"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
