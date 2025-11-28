import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import OnboardingData from "@/models/OnboardingData";
import UserPortfolio from "@/models/UserPortfolio";
import Asset from "@/models/Asset";
import { calculateSafeSavings } from "@/lib/utils";
import { calculatePredictedReturns } from "@/lib/predictions";
import mongoose from "mongoose";

export async function GET(
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

    const allocations =
      portfolio.allocations instanceof Map
        ? Object.fromEntries(portfolio.allocations)
        : portfolio.allocations;

    const currentAllocations: Record<string, number> = {
      ...allocations,
      gold: portfolio.goldAllocation,
    };

    const currentSavings = portfolio.savingsAllocation;

    const predictedReturns = calculatePredictedReturns(
      allocations,
      portfolio.goldAllocation,
      portfolio.savingsAllocation,
      onboardingData.annualSavingsInterestRate,
    );

    const stockIds = Object.keys(allocations);
    const stocks = await Asset.find({ uuid: { $in: stockIds } }).lean();

    const stockMetadata: Record<string, { name: string; symbol: string }> = {};
    stocks.forEach((stock) => {
      stockMetadata[stock.uuid] = {
        name: stock.name,
        symbol: stock.symbol,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          totalInvestment,
          safeSavings,
          currentAllocations,
          currentSavings,
          predictedReturns,
          stockMetadata,
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
