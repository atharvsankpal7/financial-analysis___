import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import OnboardingData from "@/models/OnboardingData";
import UserPortfolio from "@/models/UserPortfolio";
import { selectStocksSchema } from "@/lib/validations";

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

    const validationResult = selectStocksSchema.safeParse(body);

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

    const { selectedStockIds } = validationResult.data;

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

    // Check if user has completed profile information
    const onboardingData = await OnboardingData.findOne({ userId: user._id });

    if (!onboardingData) {
      return NextResponse.json(
        {
          success: false,
          message: "Please complete your profile information first",
        },
        { status: 400 },
      );
    }

    // Find or create portfolio
    let portfolio = await UserPortfolio.findOne({ userId: user._id });

    if (portfolio && portfolio.onboardingComplete) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Onboarding already completed. Use the stocks management page to update your portfolio.",
        },
        { status: 400 },
      );
    }

    // Initialize allocations for selected stocks
    const initialAllocations: Record<string, number> = {};
    selectedStockIds.forEach((uuid) => {
      initialAllocations[uuid] = 0;
    });

    // Update or create portfolio with stock selections and mark onboarding as complete
    portfolio = await UserPortfolio.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        selectedStockIds,
        allocations: initialAllocations,
        goldAllocation: 0,
        savingsAllocation: 0,
        onboardingComplete: true,
      },
      { upsert: true, new: true },
    );

    if (!portfolio) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create portfolio",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Stock selection saved successfully. Onboarding complete!",
        data: {
          portfolioId: portfolio._id.toString(),
          userId: user._id.toString(),
          selectedStockIds: portfolio.selectedStockIds,
          onboardingComplete: true,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Onboarding select-stocks error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
