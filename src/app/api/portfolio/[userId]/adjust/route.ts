import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import OnboardingData from "@/models/OnboardingData";
import UserPortfolio from "@/models/UserPortfolio";
import { calculateSafeSavings } from "@/lib/utils";
import { calculatePredictedReturns } from "@/lib/predictions";
import mongoose from "mongoose";
import { z } from "zod";

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    await connectDB();

    const { userId } = params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const adjustPortfolioSchema = z.object({
      proposedAllocations: z.record(z.string(), z.number().min(0)),
      proposedSavings: z.number().min(0),
    });

    const validationResult = adjustPortfolioSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
        },
        { status: 400 },
      );
    }

    const { proposedAllocations, proposedSavings } = validationResult.data;

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    const onboardingData = await OnboardingData.findOne({ userId });

    if (!onboardingData) {
      return NextResponse.json(
        {
          success: false,
          message: "Onboarding data not found",
        },
        { status: 404 },
      );
    }

    const portfolio = await UserPortfolio.findOne({ userId });

    if (!portfolio) {
      return NextResponse.json(
        {
          success: false,
          message: "Portfolio not found",
        },
        { status: 404 },
      );
    }

    const safeSavings = calculateSafeSavings(
      onboardingData.initialInvestmentAmount,
      onboardingData.savingsThreshold,
    );

    const totalInvestment = onboardingData.initialInvestmentAmount;

    if (proposedSavings < safeSavings) {
      return NextResponse.json(
        {
          success: false,
          message: `Savings cannot be less than safe savings amount of ${safeSavings}`,
        },
        { status: 400 },
      );
    }

    for (const key in proposedAllocations) {
      if (proposedAllocations[key] < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Allocations cannot be negative",
          },
          { status: 400 },
        );
      }
    }

    const totalProposed = Object.values(proposedAllocations).reduce(
      (sum, val) => sum + val,
      0,
    );

    const totalAllocated = totalProposed + proposedSavings;

    // Check if over-allocated (exceeds total investment)
    if (totalAllocated > totalInvestment + 0.01) {
      return NextResponse.json(
        {
          success: false,
          message: "Total allocations exceed available investment amount",
        },
        { status: 400 },
      );
    }

    // Calculate unallocated amount (remaining money that's not allocated)
    const unallocatedAmount = totalInvestment - totalAllocated;

    const newAllocations: Record<string, number> = {};
    let goldAllocation = 0;

    for (const key in proposedAllocations) {
      if (key === "gold") {
        goldAllocation = proposedAllocations[key];
      } else {
        newAllocations[key] = proposedAllocations[key];
      }
    }

    portfolio.allocations = newAllocations as any;
    portfolio.goldAllocation = goldAllocation;
    portfolio.savingsAllocation = proposedSavings;

    await portfolio.save();

    const predictedReturns = calculatePredictedReturns(
      newAllocations,
      goldAllocation,
      proposedSavings,
      onboardingData.annualSavingsInterestRate,
    );

    const newTotalValue = totalProposed + proposedSavings;

    return NextResponse.json(
      {
        success: true,
        message:
          unallocatedAmount > 0.01
            ? `Portfolio adjusted. ₹${unallocatedAmount.toFixed(2)} remains unallocated.`
            : "Portfolio adjusted successfully",
        data: {
          newTotalValue,
          updatedPredictions: predictedReturns,
          unallocatedAmount,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
