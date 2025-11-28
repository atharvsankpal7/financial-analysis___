export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface GoldPriceData {
  price: number;
  currency: string;
  unit: string;
  timestamp: string;
}

export async function fetchIndianStockPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(
      `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    );

    if (!response.ok) {
      return generateMockStockPrice(symbol);
    }

    const data = await response.json();

    if (data.priceInfo && data.priceInfo.lastPrice) {
      return data.priceInfo.lastPrice;
    }

    return generateMockStockPrice(symbol);
  } catch (error) {
    return generateMockStockPrice(symbol);
  }
}

export async function fetchIndianStocks(): Promise<StockData[]> {
  try {
    const response = await fetch(
      'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    );

    if (!response.ok) {
      return generateMockIndianStocks();
    }

    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      return data.data.slice(0, 50).map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.symbol,
        price: stock.lastPrice || 0,
        change: stock.change || 0,
        changePercent: stock.pChange || 0,
      }));
    }

    return generateMockIndianStocks();
  } catch (error) {
    return generateMockIndianStocks();
  }
}

export async function fetchMultipleStockPrices(symbols: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      prices[symbol] = await fetchIndianStockPrice(symbol);
    })
  );

  return prices;
}

export async function fetchGoldPrice(location: string): Promise<number> {
  try {
    const searchQuery = `gold rate ${location} india today`;
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1`
    );

    if (!response.ok) {
      return generateMockGoldPrice(location);
    }

    const data = await response.json();

    if (data.AbstractText) {
      const priceMatch = data.AbstractText.match(/₹?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (!isNaN(price)) {
          return price;
        }
      }
    }

    return await fetchGoldPriceFromGoldAPI(location);
  } catch (error) {
    return await fetchGoldPriceFromGoldAPI(location);
  }
}

async function fetchGoldPriceFromGoldAPI(location: string): Promise<number> {
  try {
    const response = await fetch(
      'https://www.goldapi.io/api/XAU/INR',
      {
        headers: {
          'x-access-token': 'goldapi-demo-key',
        },
      }
    );

    if (!response.ok) {
      return generateMockGoldPrice(location);
    }

    const data = await response.json();

    if (data.price) {
      const pricePerGram = data.price / 31.1035;
      return Math.round(pricePerGram * 10);
    }

    return generateMockGoldPrice(location);
  } catch (error) {
    return generateMockGoldPrice(location);
  }
}

function generateMockStockPrice(symbol: string): number {
  const basePrice = 1000;
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variation = (hash % 5000) + 500;
  return basePrice + variation + Math.random() * 100;
}

function generateMockGoldPrice(location: string): number {
  const basePrice = 6000;
  const hash = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variation = (hash % 500);
  return basePrice + variation + Math.random() * 50;
}

function generateMockIndianStocks(): StockData[] {
  const indianStocks = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
    'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
    'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'BAJFINANCE',
    'HCLTECH', 'WIPRO', 'ULTRACEMCO', 'SUNPHARMA', 'TITAN',
    'NESTLEIND', 'TATASTEEL', 'POWERGRID', 'NTPC', 'ONGC',
    'M&M', 'TECHM', 'BAJAJFINSV', 'ADANIPORTS', 'COALINDIA',
    'DRREDDY', 'DIVISLAB', 'GRASIM', 'HINDALCO', 'JSWSTEEL',
    'BRITANNIA', 'EICHERMOT', 'SHREECEM', 'INDUSINDBK', 'CIPLA',
    'TATAMOTORS', 'APOLLOHOSP', 'HEROMOTOCO', 'BPCL', 'UPL',
    'BAJAJ-AUTO', 'SBILIFE', 'HDFCLIFE', 'ADANIENT', 'TATACONSUM'
  ];

  return indianStocks.map((symbol, index) => ({
    symbol,
    name: symbol,
    price: generateMockStockPrice(symbol),
    change: (Math.random() - 0.5) * 100,
    changePercent: (Math.random() - 0.5) * 5,
  }));
}

export async function fetchLatestGoldPriceForLocation(location: string): Promise<{ price: number; date: string }> {
  const today = new Date().toISOString().split('T')[0];
  const price = await fetchGoldPrice(location);

  return {
    price,
    date: today,
  };
}

export function getStockSearchResults(query: string, stocks: any[]): any[] {
  if (!query) {
    return stocks;
  }

  const lowerQuery = query.toLowerCase();

  return stocks.filter((stock) => {
    return (
      stock.name.toLowerCase().includes(lowerQuery) ||
      stock.symbol.toLowerCase().includes(lowerQuery)
    );
  });
}
