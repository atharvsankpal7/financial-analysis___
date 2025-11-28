import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UserPortfolio from "@/models/UserPortfolio";
import Asset from "@/models/Asset";
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

    const updateStocksSchema = z.object({
      selectedStockIds: z
        .array(z.string())
        .min(1, "At least one stock must be selected"),
    });

    const validationResult = updateStocksSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
        },
        { status: 400 },
      );
    }

    const { selectedStockIds } = validationResult.data;

    const stocks = await Asset.find({
      uuid: { $in: selectedStockIds },
      category: "stock",
    });

    if (stocks.length !== selectedStockIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Some selected stocks are invalid",
        },
        { status: 400 },
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

    const oldAllocations =
      portfolio.allocations instanceof Map
        ? Object.fromEntries(portfolio.allocations)
        : portfolio.allocations;

    const oldStockIds = portfolio.selectedStockIds;
    const removedStockIds = oldStockIds.filter(
      (id) => !selectedStockIds.includes(id),
    );
    const addedStockIds = selectedStockIds.filter(
      (id) => !oldStockIds.includes(id),
    );

    const newAllocations: Record<string, number> = {};

    for (const stockId of selectedStockIds) {
      if (oldAllocations[stockId] !== undefined) {
        newAllocations[stockId] = oldAllocations[stockId];
      } else {
        newAllocations[stockId] = 0;
      }
    }

    const removedAmount = removedStockIds.reduce(
      (sum, id) => sum + (oldAllocations[id] || 0),
      0,
    );

    if (removedAmount > 0) {
      portfolio.savingsAllocation += removedAmount;
    }

    portfolio.selectedStockIds = selectedStockIds;
    portfolio.allocations = newAllocations as any;

    await portfolio.save();

    return NextResponse.json(
      {
        success: true,
        message: "Stock selection updated successfully",
        data: {
          portfolioId: portfolio._id.toString(),
          addedStocks: addedStockIds.length,
          removedStocks: removedStockIds.length,
          reallocatedAmount: removedAmount,
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
