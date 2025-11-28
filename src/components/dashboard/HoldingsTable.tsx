'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface Holding {
  asset: string;
  currentValue: number;
  allocation: number;
  predictedReturn: number;
}

interface HoldingsTableProps {
  holdings: Holding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead className="text-right">Current Value</TableHead>
          <TableHead className="text-right">Allocation</TableHead>
          <TableHead className="text-right">Predicted Annual Return</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.map((holding, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{holding.asset}</TableCell>
            <TableCell className="text-right">{formatCurrency(holding.currentValue)}</TableCell>
            <TableCell className="text-right">{formatPercentage(holding.allocation)}</TableCell>
            <TableCell className="text-right text-green-600">{formatPercentage(holding.predictedReturn)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
