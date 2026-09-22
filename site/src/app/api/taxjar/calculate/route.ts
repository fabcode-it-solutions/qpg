import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  taxJarService,
  createTaxCalculationRequest,
  shouldCalculateTax,
  BillingAddress,
  OrderItem,
} from "@/lib/taxjar";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      billingAddress,
      items,
      shipping = 0,
      customerId,
    } = await req.json();

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

    // Check if TaxJar is configured
    if (!taxJarService.isConfigured()) {
      console.warn("TaxJar not configured, returning zero tax");
      return NextResponse.json({
        success: true,
        taxAmount: 0,
        taxRate: 0,
        taxableAmount: 0,
        hasNexus: false,
        message: "Tax calculation not available",
      });
    }

    // Check if we should calculate tax for this address
    if (!shouldCalculateTax(billingAddress)) {
      return NextResponse.json({
        success: true,
        taxAmount: 0,
        taxRate: 0,
        taxableAmount: 0,
        hasNexus: false,
        message: "No tax required for this location",
      });
    }

    // Create tax calculation request
    const taxRequest = createTaxCalculationRequest(
      billingAddress as BillingAddress,
      items as OrderItem[],
      shipping,
      customerId || session.user.id
    );

    // Calculate tax
    const result = await taxJarService.calculateTax(taxRequest);

    if (!result.success) {
      console.error("Tax calculation failed:", result.error);
      return NextResponse.json(
        { error: result.error || "Tax calculation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      taxAmount: Math.round(result.taxAmount * 100), // Convert to cents
      taxRate: result.taxRate,
      taxableAmount: Math.round(result.taxableAmount * 100), // Convert to cents
      hasNexus: result.hasNexus,
      breakdown: result.breakdown,
    });
  } catch (error) {
    console.error("Tax calculation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
