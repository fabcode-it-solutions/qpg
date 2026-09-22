import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  calculateTaxInclusive,
  TaxInclusiveItem,
} from "@/lib/taxjar/tax-inclusive-utils";
import { BillingAddress } from "@/lib/taxjar";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { billingAddress, items, shipping = 0 } = await req.json();

    // Validate required fields
    if (!billingAddress || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing required fields: billingAddress, items" },
        { status: 400 }
      );
    }

    // Validate billing address
    const requiredFields = [
      "firstName",
      "lastName",
      "address",
      "city",
      "state",
      "zip",
    ];
    for (const field of requiredFields) {
      if (!billingAddress[field]) {
        return NextResponse.json(
          { error: `Missing required billing field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate items
    for (const item of items) {
      if (
        !item.id ||
        !item.description ||
        !item.totalPriceIncludingTax ||
        !item.quantity
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid item data. Required: id, description, totalPriceIncludingTax, quantity",
          },
          { status: 400 }
        );
      }
    }

    // Calculate tax-inclusive breakdown
    const result = await calculateTaxInclusive(
      billingAddress as BillingAddress,
      items as TaxInclusiveItem[],
      shipping
    );

    if (!result.success) {
      console.error("Tax-inclusive calculation failed:", result.error);
      return NextResponse.json(
        { error: result.error || "Tax calculation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      basePrice: result.basePrice, // Price without tax
      taxAmount: result.taxAmount, // Calculated tax amount
      totalPrice: result.totalPrice, // Original $99 price
      taxRate: result.taxRate,
      hasNexus: result.hasNexus,
      breakdown: {
        subtotal: result.basePrice,
        tax: result.taxAmount,
        shipping: shipping,
        total: result.totalPrice + shipping,
      },
    });
  } catch (error) {
    console.error("Tax-inclusive calculation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
