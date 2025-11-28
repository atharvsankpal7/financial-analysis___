import { NextRequest, NextResponse } from "next/server";
import { fetchLatestGoldPriceForLocation } from "@/lib/external-api";
import { goldPriceQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");

    const validationResult = goldPriceQuerySchema.safeParse({ state });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "State parameter is required",
        },
        { status: 400 },
      );
    }

    const goldPriceData = await fetchLatestGoldPriceForLocation(validationResult.data.state);

    return NextResponse.json(
      {
        success: true,
        data: {
          price: goldPriceData.price,
          date: goldPriceData.date,
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
