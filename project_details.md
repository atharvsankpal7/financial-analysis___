# High-Level Architectural Design for Onboarding Flow and Investment Adjustment Interface

This document finalizes the Software Requirements Specification (SRS) for the financial investment application's onboarding flow and investment adjustment interface. It combines and reconciles inputs from two engineering teams, prioritizing comprehensive data requirements, UI structures, user interactions, and data flows. The tech stack is Next.js 14.3 + TypeScript, Shadcn UI, MongoDB (Mongoose). Focus is on data flow, UI structure, and user experience.

## 🟦 1. Onboarding – Initial Information

This initial step is a simple, single-screen form to capture essential financial context without friction. It uses geolocation for location (India-only) and includes real-time validation.

### Data Requirements
- **User Profile Data** (stored in `users` collection):
  - `fullName`: String
  - `location`: Object `{ state: String, city: String, coordinates: { lat: Number, lng: Number }, country: 'India' }` (auto-detected via device Geolocation API)
  - `initialInvestmentAmount`: Number (in INR)
  - `savingsThreshold`: Object `{ type: 'percentage' | 'fixed', value: Number }` (stores both value and type for flexibility in user thinking about safe savings)
  - `annualSavingsInterestRate`: Number (percentage)
  - `createdAt`, `updatedAt`: Timestamps

### UI Components (Shadcn UI)
- **Form Elements**:
  - `<Input />` for `fullName`.
  - `<Input type="number" />` for `initialInvestmentAmount` (prefixed with '₹' symbol).
  - Location Autodetect Banner: `<Card />` with detected location display and a "Refresh Location" or "Detect Location" `<Button />` (triggers browser permission; fallback to manual override `<Input />` for city/state).
  - Savings Threshold Selector:
    - `<RadioGroup />` or `<Select />` for threshold type ("Percentage" / "Fixed Amount").
    - Adjacent `<Input type="number" />` for threshold value (context-sensitive, e.g., % suffix for percentage).
  - `<Input type="number" />` for `annualSavingsInterestRate` (with '%' suffix).
- **Progress Indicator**: `<Progress />` bar or step indicator at top (Step 1 of 2).
- **Primary Actions**:
  - "Next" or "Continue" `<Button />` (disabled until all fields valid, e.g., positive numbers, reasonable ranges).
  - "Back" `<Button />` (optional for multi-step wizard feel).

A central `<Card />` contains the entire form for a clean, contained layout.

### User Interactions
1. On page load (after signup): Trigger Geolocation API to autofill `location` field (with error fallback to manual entry).
2. User fills required fields: Real-time validation (e.g., investment amount > 0, interest rate in reasonable range like 0-10%).
3. User clicks "Detect Location" / "Refresh Location" and grants permission; app displays city/state (disabled `<Input />`); manual override available.
4. User selects threshold method and enters value.
5. On "Next" / "Continue":
   - Data stored in temporary onboarding context (e.g., React Context or Zustand store).
   - Validated data sent to backend via Next.js Server Action (`/api/onboarding/initial-info`).
   - Persist to MongoDB `users` document.
   - Navigate to Investment Selection step.

## 🟩 2. Onboarding – Investment Selection

This step lets users specify investment interests (e.g., stocks) to personalize dashboard and predictions. It supports search and multi-select.

### Data Requirements
- **Investment Options** (read from `assets` collection):
  - `uuid`: String
  - `symbol`: String (e.g., "TCS.NS")
  - `name`: String
  - `category`: String (e.g., "stock", "gold")
  - `currentPrice`: Number (fetched periodically via external API)
- **User Selections** (stored in `userPortfolios` collection):
  - `userId`: ObjectId (references `users`)
  - `selectedStockIds`: Array of UUIDs
  - `goldAllocation`: Optional Number (defaults set later)
  - Initial allocation mapping: `stock UUID → 0` (adjusted in Prediction & Adjustment phase)
  - `onboardingComplete`: Boolean (set to `true` on completion)

### UI Components (Shadcn UI)
- **Stock Search & Selection**:
  - `<Input />` for searching by name/symbol (fuzzy search + debounce).
  - `<Command />` component for searchable list (ideal for multi-select): `<CommandInput />` as search bar, `<CommandList />` within `<ScrollArea />` for large lists.
  - Each item: `<CommandItem />` with `<Checkbox />` (Shadcn) for selection, displaying name/ticker.
  - "Select All / Clear All" `<Button />`.
- **Selection Summary Panel**:
  - `<Badge />` or list of selected stocks (e.g., count or names).
- **Primary Actions**:
  - "Next" or "Finish Setup" `<Button />` (disabled if no stocks selected).
- **Progress Indicator**: Step 2 of 2.
- A `<Card />` with title "Select Your Investment Interests."

### User Interactions
1. User presented with list of stocks (fetched from backend).
2. User scrolls or searches to filter by name/ticker; clicks to select/deselect (checkbox reflects state).
3. Selected stock UUIDs stored in onboarding context.
4. On "Next" / "Finish Setup":
   - Array of selected UUIDs sent to backend (`/api/onboarding/select-stocks`).
   - Persist to new `userPortfolios` document (associate with user profile, set `onboardingComplete: true`).
   - Redirect to main portfolio dashboard / Running Phase.

## 🟨 3. Running Phase – Data Display (Portfolio Visualization)

This is the primary dashboard: a clear, at-a-glance overview prioritizing data visualization. It fetches live data and supports real-time updates.

### Data Requirements
- **User Portfolio** (from `userPortfolios`):
  - `userId`, `allocations`: Object `{ stock UUID: amount invested }`, `goldAllocation`, `savingsAllocation`
- **Asset Data** (from `assets` and related collections):
  - Real-time stock prices (via external API, e.g., Polygon; fetched on load and periodically).
  - `goldPrice`: Daily state-specific gold price (updated via cron job, stored in `goldPrices` collection by state and date).
- **Derived Data**:
  - Total portfolio value (live calculation).
  - Percentage distribution per asset category (Savings, Gold, Stocks).

Predicted annual returns pre-calculated by backend model.

### UI Components (Shadcn UI)
- **Dashboard Layout**:
  - Main heading: Total Portfolio Value (large font).
  - Portfolio Summary `<Card />`: Total value, daily change %, timestamp of last update.
- **Visualization**:
  - Portfolio Distribution: `<BarChart />` or Stacked Bar (using Shadcn Chart components on Recharts): `<ResponsiveContainer />` + `<BarChart />` showing allocation across Savings / Gold / Stocks (or individual stocks); interactive with hover tooltips for precise values.
- **Tab View**:
  - Overview | Stock Breakdown | Gold | Savings using `<Tabs />`.
- **Detailed Breakdown**:
  - `<Table />` for holdings (Stock Breakdown tab): Columns – Asset (e.g., "Savings", "Gold (24K)", "TCS"), Current Value (₹), Allocation (%), Predicted Annual Return (%); includes quantity and P/L where applicable.
- **Primary CTA**: "Adjust Investments" `<Button />`.

### User Interactions
1. On page load: Fetch user portfolio, market data, and gold price using Next.js Server Components (initial static render); client-side handles real-time stock updates (e.g., SWR or React Query with short refetch interval).
2. Bar chart interactive: Hover for tooltips; click segments to filter table view.
3. Daily cron job updates gold prices server-side; frontend queries latest.
4. User reviews allocation and predictions.
5. Click "Adjust Investments" → navigates to Prediction & Adjustment interface (e.g., opens modal or new route).

## 🟧 4. Running Phase – Prediction & Adjustment

This interactive "what-if" tool empowers rebalancing based on predictions. It uses client-side state for proposals and server validation.

### Data Requirements
- **Current Portfolio Allocations** (as in Section 3).
- **Predicted Returns** (calculated server-side on demand):
  - Based on models (e.g., historical average return %, custom strategy).
  - Projections for: Stocks (per UUID), Gold (state-specific), Savings (user interest rate).
- **Proposed Adjustments** (temporary client-side state):
  - `disposableAmount`: Number (calculated as Total Investment - Safe Savings; pool for allocation).
  - `proposedAllocations`: Object detailing new amounts per asset (stocks, gold).
  - `remainingDisposable`: Number (calculated live as `disposableAmount - sum(proposedAllocations)`).

### UI Components (Shadcn UI)
- **Modal Interface**: `<Dialog />` (opens on "Adjust Investments" click).
  - Title: "Adjust Your Disposable Investments" with prominent `disposableAmount` display.
- **Prediction Cards**:
  - For each category (Stocks, Gold, Savings): `<Card />` with predicted % return and absolute return value.
- **Allocation Adjustment** (for each adjustable asset: selected stocks and gold):
  - `<Label />` with asset name.
  - `<Slider />` (range 0 to `disposableAmount`) for visual adjustments.
  - Linked `<Input type="number" />` for precise entry.
  - For stocks: Grouped in collapsible panel with individual sliders.
- **Summary & Comparison**:
  - `<Table />`: Columns – Asset, Current Allocation (₹), Proposed Allocation (₹).
  - Two-column layout: Current vs. Proposed (e.g., side-by-side bar graphs).
  - Visible text: "Remaining to Allocate: ₹{remainingDisposable}" (color red if negative; use `<Badge variant="secondary" />`).
- **Actions**:
  - "Confirm Changes" or "Save Adjustments" `<Button />` (disabled until `remainingDisposable === 0`).
  - "Cancel" or "Reset" `<Button />` (closes dialog or resets sliders to current).

### User Interactions
1. User clicks "Adjust Investments" → opens `<Dialog />`.
2. User moves sliders or types inputs: Client-side `proposedAllocations` updates; other sliders dynamically adjust max to prevent over-allocation; summary table and remaining text update in real-time.
3. Real-time validation: If total > available, highlight in red and disable Save/Confirm.
4. Once `remainingDisposable === 0`, button activates.
5. On "Confirm Changes" / "Save":
   - Send `proposedAllocations` to backend via PUT (`/api/portfolio/adjust`).
   - Backend validates transaction, updates `userPortfolios` allocations in MongoDB, recalculates predictions, persists snapshot for analytics.
   - Dialog closes; dashboard re-fetches data to reflect updates (e.g., refresh graphs).

## 🔄 Data Flow Overview
1. **Onboarding Context** (client): Temporary storage (React Context / Zustand) → Persist user + initial selections to DB via API endpoints.
2. **Server** (Next.js Route Handlers / Server Actions): CRUD operations on `users`, `assets`, `userPortfolios`.
3. **Cron Jobs**: Update asset prices periodically (e.g., gold daily per state via external API into `goldPrices` collection).
4. **Client (Dashboard)**: Real-time fetching (e.g., SWR/React Query) + client-side calculations for visualization and proposals.
5. **Prediction Engine**: Server-side calculations on demand for adjustment UI and pre-calculated returns.
