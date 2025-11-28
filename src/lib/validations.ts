import { z } from "zod";

export const locationSchema = z.object({
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  country: z.string().default("India"),
});

export const savingsThresholdSchema = z.object({
  type: z.enum(["percentage", "fixed"]),
  value: z.number().min(0),
});

export const initialInfoSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  location: locationSchema,
  initialInvestmentAmount: z.number().min(1000, "Minimum investment is ₹1,000"),
  savingsThreshold: savingsThresholdSchema,
  annualSavingsInterestRate: z.number().min(0).max(100),
});

export const selectStocksSchema = z.object({
  selectedStockIds: z
    .array(z.string())
    .min(1, "At least one stock must be selected"),
});

export const adjustPortfolioSchema = z.object({
  proposedAllocations: z.record(z.string(), z.number().min(0)),
  proposedSavings: z.number().min(0),
});

export const goldPriceQuerySchema = z.object({
  state: z.string().min(1, "State is required"),
});

export type InitialInfoInput = z.infer<typeof initialInfoSchema>;
export type SelectStocksInput = z.infer<typeof selectStocksSchema>;
export type AdjustPortfolioInput = z.infer<typeof adjustPortfolioSchema>;
export type GoldPriceQuery = z.infer<typeof goldPriceQuerySchema>;
