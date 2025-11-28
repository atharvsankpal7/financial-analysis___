import { NextRequest, NextResponse } from 'next/server';
import { fetchIndianStocks } from '@/lib/external-api';

function generateUUID(symbol: string): string {
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hex = hash.toString(16).padStart(8, '0');
  return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(0, 3)}-${hex.slice(0, 4)}-${hex.slice(0, 12)}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    const stocks = await fetchIndianStocks();

    let filteredStocks = stocks;

    if (search) {
      const lowerSearch = search.toLowerCase();
      filteredStocks = stocks.filter((stock) =>
        stock.name.toLowerCase().includes(lowerSearch) ||
        stock.symbol.toLowerCase().includes(lowerSearch)
      );
    }

    const enrichedAssets = filteredStocks.slice(0, limit).map((stock) => ({
      uuid: generateUUID(stock.symbol),
      symbol: stock.symbol,
      name: stock.name,
      category: 'stock',
      currentPrice: stock.price,
    }));

    return NextResponse.json(enrichedAssets, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
