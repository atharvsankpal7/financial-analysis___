'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface StockHolding {
  name: string;
  symbol: string;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  allocation: number;
  predictedReturn: number;
}

interface StockBreakdownTableProps {
  holdings: StockHolding[];
}

export function StockBreakdownTable({ holdings }: StockBreakdownTableProps) {
  if (holdings.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">No stock holdings</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Stock</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Current Price</TableHead>
          <TableHead className="text-right">Current Value</TableHead>
          <TableHead className="text-right">Allocation</TableHead>
          <TableHead className="text-right">Predicted Return</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.map((holding, index) => (
          <TableRow key={index}>
            <TableCell>
              <div>
                <div className="font-medium">{holding.name}</div>
                <div className="text-sm text-muted-foreground">{holding.symbol}</div>
              </div>
            </TableCell>
            <TableCell className="text-right">{holding.quantity.toFixed(4)}</TableCell>
            <TableCell className="text-right">{formatCurrency(holding.currentPrice)}</TableCell>
            <TableCell className="text-right">{formatCurrency(holding.currentValue)}</TableCell>
            <TableCell className="text-right">{formatPercentage(holding.allocation)}</TableCell>
            <TableCell className="text-right text-green-600">{formatPercentage(holding.predictedReturn)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
