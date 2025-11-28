import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import OnboardingData from "@/models/OnboardingData";
import UserPortfolio from "@/models/UserPortfolio";
import { initialInfoSchema } from "@/lib/validations";
import { calculateSafeSavings } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login first.",
        },
        { status: 401 },
      );
    }

    await connectDB();

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

    // Verify user exists
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    // Check if onboarding data already exists
    const existingOnboarding = await OnboardingData.findOne({
      userId: user._id,
    });

    if (existingOnboarding) {
      // Update existing onboarding data
      existingOnboarding.fullName = data.fullName;
      existingOnboarding.location = data.location;
      existingOnboarding.initialInvestmentAmount = data.initialInvestmentAmount;
      existingOnboarding.savingsThreshold = data.savingsThreshold;
      existingOnboarding.annualSavingsInterestRate =
        data.annualSavingsInterestRate;
      await existingOnboarding.save();
    } else {
      // Create new onboarding data
      await OnboardingData.create({
        userId: user._id,
        fullName: data.fullName,
        location: data.location,
        initialInvestmentAmount: data.initialInvestmentAmount,
        savingsThreshold: data.savingsThreshold,
        annualSavingsInterestRate: data.annualSavingsInterestRate,
      });
    }

    // Ensure portfolio exists for the user
    let portfolio = await UserPortfolio.findOne({ userId: user._id });

    if (!portfolio) {
      portfolio = await UserPortfolio.create({
        userId: user._id,
        selectedStockIds: [],
        allocations: {},
        goldAllocation: 0,
        savingsAllocation: 0,
        onboardingComplete: false,
      });
    }

    const safeSavings = calculateSafeSavings(
      data.initialInvestmentAmount,
      data.savingsThreshold,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Profile saved successfully",
        data: {
          userId: user._id.toString(),
          safeSavings,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Onboarding initial-info error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
