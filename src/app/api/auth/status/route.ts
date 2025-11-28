import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import OnboardingData from "@/models/OnboardingData";
import UserPortfolio from "@/models/UserPortfolio";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          data: {
            isAuthenticated: false,
            hasCompletedOnboarding: false,
          },
        },
        { status: 401 },
      );
    }

    await connectDB();

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

    const onboardingData = await OnboardingData.findOne({ userId: user._id });
    const portfolio = await UserPortfolio.findOne({ userId: user._id });

    // Check if user has completed profile information
    const hasProfileInfo = !!onboardingData;

    // Check if user has completed stock selection
    const hasStockSelection = !!(
      portfolio &&
      portfolio.selectedStockIds &&
      portfolio.selectedStockIds.length > 0
    );

    // User has completed onboarding if both profile and stock selection are done
    const hasCompletedOnboarding =
      hasProfileInfo && hasStockSelection && portfolio?.onboardingComplete;

    return NextResponse.json(
      {
        success: true,
        data: {
          isAuthenticated: true,
          hasCompletedOnboarding,
          hasProfileInfo,
          hasStockSelection,
          userId: user._id.toString(),
          email: user.email,
          fullName: onboardingData?.fullName || null,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Auth status check error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
