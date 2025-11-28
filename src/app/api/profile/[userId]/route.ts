import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import OnboardingData from "@/models/OnboardingData";
import UserPortfolio from "@/models/UserPortfolio";
import { initialInfoSchema } from "@/lib/validations";
import { calculateSafeSavings } from "@/lib/utils";
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

    return NextResponse.json(
      {
        success: true,
        data: {
          fullName: onboardingData.fullName,
          location: onboardingData.location,
          initialInvestmentAmount: onboardingData.initialInvestmentAmount,
          savingsThreshold: onboardingData.savingsThreshold,
          annualSavingsInterestRate: onboardingData.annualSavingsInterestRate,
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

    const validationResult = initialInfoSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const data = validationResult.data;

    if (data.location.country !== "India") {
      return NextResponse.json(
        {
          success: false,
          message: "Service is only available in India",
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

    const existingOnboarding = await OnboardingData.findOne({ userId });

    if (!existingOnboarding) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Onboarding data not found. Please complete onboarding first.",
        },
        { status: 404 },
      );
    }

    const portfolio = await UserPortfolio.findOne({ userId });

    if (portfolio) {
      const currentTotalAllocated =
        Object.values(portfolio.allocations).reduce(
          (sum, val) => sum + val,
          0,
        ) +
        portfolio.goldAllocation +
        portfolio.savingsAllocation;

      const unallocatedAmount =
        existingOnboarding.initialInvestmentAmount - currentTotalAllocated;
      const investmentReduction =
        existingOnboarding.initialInvestmentAmount -
        data.initialInvestmentAmount;

      if (investmentReduction > 0 && investmentReduction > unallocatedAmount) {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot reduce investment by ₹${investmentReduction}. Only ₹${unallocatedAmount} is unallocated. Please adjust your portfolio allocations first.`,
          },
          { status: 400 },
        );
      }
    }

    const oldInvestmentAmount = existingOnboarding.initialInvestmentAmount;
    const oldSafeSavings = calculateSafeSavings(
      oldInvestmentAmount,
      existingOnboarding.savingsThreshold,
    );
    const newSafeSavings = calculateSafeSavings(
      data.initialInvestmentAmount,
      data.savingsThreshold,
    );

    existingOnboarding.fullName = data.fullName;
    existingOnboarding.location = data.location;
    existingOnboarding.initialInvestmentAmount = data.initialInvestmentAmount;
    existingOnboarding.savingsThreshold = data.savingsThreshold;
    existingOnboarding.annualSavingsInterestRate =
      data.annualSavingsInterestRate;

    await existingOnboarding.save();

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: {
          fullName: existingOnboarding.fullName,
          location: existingOnboarding.location,
          initialInvestmentAmount: existingOnboarding.initialInvestmentAmount,
          savingsThreshold: existingOnboarding.savingsThreshold,
          annualSavingsInterestRate:
            existingOnboarding.annualSavingsInterestRate,
          oldSafeSavings,
          newSafeSavings,
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
