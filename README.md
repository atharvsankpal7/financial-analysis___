# Financial Analysis - Investment Portfolio Management

A production-ready Next.js 14.3 application for managing investment portfolios with support for stocks, gold, and savings allocations.

## Features

- **Onboarding Flow**: Two-step onboarding process to capture user information and investment preferences
- **Portfolio Dashboard**: Real-time portfolio visualization with interactive pie and bar charts
- **Investment Adjustment**: Dynamic rebalancing interface with savings adjustment capability
- **Multi-Asset Support**: Stocks, Gold, and Savings accounts
- **Flexible Savings**: Allocate more than minimum safe savings if desired
- **Location-Based**: Auto-detect user location for state-specific gold prices
- **Prediction Engine**: Calculate predicted returns for different asset classes
- **Component-Based Architecture**: Modular dashboard components for better code organization

## Tech Stack

- **Framework**: Next.js 14.2 with App Router
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **UI Components**: Radix UI + Tailwind CSS
- **Charts**: Recharts
- **Validation**: Zod
- **Package Manager**: pnpm

## Prerequisites

- Node.js 18+ 
- MongoDB (local or remote instance)
- pnpm

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Ensure MongoDB is running:
   - If using local MongoDB: Start MongoDB service
   - If using MongoDB Atlas: Get your connection string

3. Set up environment variables:
   - The `.env.local` file is already created with default values
   - Update `MONGODB_URI` if not using default local MongoDB
   - Optional: Add API keys for `POLYGON_API_KEY` and `MCX_API_KEY` for real-time data
   - The app will use mock data if API keys are not provided

4. Seed the database with initial stock data:
```bash
pnpm seed
```
   This will populate the database with 40 Indian stocks and gold prices for all states.

5. Start the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

You will be redirected to the onboarding flow automatically.

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens (if implementing authentication)
- `NEXT_PUBLIC_API_URL`: Public API URL
- `POLYGON_API_KEY`: (Optional) Polygon.io API key for real-time stock prices
- `MCX_API_KEY`: (Optional) MCX API key for gold prices
- `NODE_ENV`: Environment (development/production)

## API Endpoints

### Onboarding
- `POST /api/onboarding/initial-info` - Save user profile information
- `POST /api/onboarding/select-stocks` - Save selected stocks

### Assets
- `GET /api/assets/stocks` - Get list of available stocks

### Portfolio
- `GET /api/portfolio/[userId]` - Get user portfolio data
- `GET /api/portfolio/[userId]/predictions` - Get prediction data for adjustments
- `PUT /api/portfolio/[userId]/adjust` - Update portfolio allocations

### Gold Prices
- `GET /api/gold-prices/latest?state=<state>` - Get latest gold price for a state

## Project Structure

```
Financial_Analysis/
├── src/
│   ├── app/
│   │   ├── api/              # API route handlers
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── onboarding/       # Onboarding pages
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   └── AdjustmentDialog.tsx
│   ├── lib/
│   │   ├── mongodb.ts        # Database connection
│   │   ├── types.ts          # TypeScript types
│   │   ├── utils.ts          # Utility functions
│   │   ├── validations.ts    # Zod schemas
│   │   ├── predictions.ts    # Prediction engine
│   │   └── external-api.ts   # External API integrations
│   └── models/               # Mongoose models
│       ├── User.ts
│       ├── Asset.ts
│       ├── UserPortfolio.ts
│       └── GoldPrice.ts
├── scripts/
│   └── seed.ts               # Database seed script
└── public/                   # Static assets
```

## Database Models

### User
- Full name, location, initial investment amount
- Savings threshold (percentage or fixed)
- Annual savings interest rate

### Asset
- Stock/Gold information
- Symbol, name, category, current price

### UserPortfolio
- User's selected stocks
- Allocations for each asset
- Gold and savings allocations

### GoldPrice
- State-specific gold prices
- Historical price data

## Development

### Build for Production
```bash
pnpm build
```

### Start Production Server
```bash
pnpm start
```

### Linting
```bash
pnpm lint
```

## User Workflow

1. **Onboarding - Initial Info (Step 1 of 2)**:
   - Enter full name
   - Auto-detect or manually enter location (state and city)
   - Enter initial investment amount (minimum ₹1,000)
   - Choose savings threshold (percentage or fixed amount)
   - Enter annual savings interest rate

2. **Onboarding - Stock Selection (Step 2 of 2)**:
   - Browse and search from 40 Indian stocks
   - Select stocks of interest using checkboxes
   - Use "Select All" or "Clear All" for bulk selection
   - Complete onboarding (minimum 1 stock required)

3. **Dashboard**:
   - View total portfolio value and distribution
   - Interactive pie chart and bar chart showing allocation across Savings, Gold, and Stocks
   - Tabbed view for Overview, Stock Breakdown, Gold, and Savings details
   - Detailed holdings table with current values and predicted returns
   - Separate component architecture for better code organization

4. **Investment Adjustment**:
   - Click "Adjust Investments" button
   - View predicted returns for each asset (Savings, Gold, Stocks)
   - Adjust savings allocation (must be at or above safe savings minimum)
   - Use sliders or input fields to reallocate across all assets
   - Real-time validation ensures total equals total investment
   - Allocate any remaining funds directly to savings
   - Confirm changes to update portfolio

## Important Notes

- **Geolocation**: The app uses browser's Geolocation API for auto-detecting user location (requires permission)
- **Mock Data**: When `POLYGON_API_KEY` or `MCX_API_KEY` are not provided, the app generates realistic mock data
- **Safe Savings**: Calculated based on user's threshold settings; this is the minimum savings amount required
- **Flexible Savings**: Users can now allocate MORE than the safe savings amount if desired
- **Total Investment**: All allocations (Savings + Gold + Stocks) must equal the total initial investment
- **Predicted Returns**: Currently use historical averages (12.5% for stocks, 8% for gold, user-defined for savings)
- **Currency**: All monetary values are in INR (Indian Rupees)
- **Database**: Must have MongoDB running before starting the application
- **First Time Setup**: Always run `pnpm seed` to populate initial stock data
- **Component Architecture**: Dashboard is now split into reusable components for better maintainability

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or start MongoDB service
- Check `MONGODB_URI` in `.env.local` matches your MongoDB instance
- For MongoDB Atlas, ensure IP whitelist is configured

### Build Errors
- Clear Next.js cache: `rm -rf .next` (or `rmdir /s .next` on Windows)
- Reinstall dependencies: `rm -rf node_modules && pnpm install`
- Ensure Node.js version is 18 or higher

### No Stocks Available
- Run the seed script: `pnpm seed`
- Check MongoDB connection and verify `assets` collection exists

### Location Detection Not Working
- Allow browser location permission when prompted
- Manually enter location if geolocation fails
- Ensure using HTTPS in production (geolocation requires secure context)

## Production Considerations

- Set up proper authentication and authorization
- Implement rate limiting for API endpoints
- Add caching layer (Redis) for frequently accessed data
- Set up monitoring and logging (e.g., Sentry, LogRocket)
- Configure CORS properly
- Use environment-specific configurations
- Implement proper error boundaries
- Add comprehensive testing (unit, integration, e2e)
- Set up CI/CD pipelines
- Use a production-grade MongoDB instance (MongoDB Atlas)
- Implement data backup and recovery strategies


