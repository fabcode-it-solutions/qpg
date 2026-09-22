import { BillingAddress, OrderItem } from "./utils";
import { taxJarService } from "./service";
import { createTaxCalculationRequest } from "./utils";

export interface TaxInclusiveItem {
  id: string;
  description: string;
  quantity: number;
  totalPriceIncludingTax: number; // $99 in cents (9900)
  type?: "course" | "subscription" | "digital" | "software";
}

export interface TaxInclusiveCalculationResult {
  success: boolean;
  basePrice: number; // Price without tax
  taxAmount: number; // Calculated tax amount
  totalPrice: number; // Original tax-inclusive price
  taxRate: number;
  hasNexus: boolean;
  error?: string;
}

/**
 * Calculate base price and tax amount from tax-inclusive total
 * This is the correct approach for $99 tax-inclusive pricing
 */
export async function calculateTaxInclusive(
  billingAddress: BillingAddress,
  items: TaxInclusiveItem[],
  shipping: number = 0
): Promise<TaxInclusiveCalculationResult> {
  try {
    const totalInclusivePrice = items.reduce(
      (sum, item) => sum + item.totalPriceIncludingTax * item.quantity,
      0
    );

    // Step 1: Calculate tax on the FULL amount to get the tax rate
    // This is the correct approach for tax-inclusive pricing
    const fullPriceItems: OrderItem[] = items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.totalPriceIncludingTax, // Use FULL price to get tax rate
      type: item.type,
    }));

    const taxRequest = createTaxCalculationRequest(
      billingAddress,
      fullPriceItems,
      shipping
    );

    console.log("TaxJar Request (Full Price):", JSON.stringify(taxRequest, null, 2));

    const taxResult = await taxJarService.calculateTax(taxRequest);

    console.log("TaxJar Response:", {
      success: taxResult.success,
      taxAmount: taxResult.taxAmount,
      taxRate: taxResult.taxRate,
      taxableAmount: taxResult.taxableAmount,
      hasNexus: taxResult.hasNexus,
      error: taxResult.error,
    });

    if (!taxResult.success) {
      return {
        success: false,
        basePrice: 0,
        taxAmount: 0,
        totalPrice: totalInclusivePrice,
        taxRate: 0,
        hasNexus: false,
        error: taxResult.error,
      };
    }

    // If no tax (rate is 0 or taxable amount is 0), the full amount is the base price
    if (taxResult.taxRate === 0 || taxResult.taxableAmount === 0 || isNaN(taxResult.taxRate)) {
      console.log("No tax applicable - using full amount as base price");
      return {
        success: true,
        basePrice: totalInclusivePrice,
        taxAmount: 0,
        totalPrice: totalInclusivePrice,
        taxRate: 0,
        hasNexus: taxResult.hasNexus,
      };
    }

    // Step 2: Calculate base price from tax-inclusive total using the tax rate
    // Formula: basePrice = totalInclusivePrice / (1 + taxRate)
    const calculatedBasePrice = Math.round(totalInclusivePrice / (1 + taxResult.taxRate));
    const calculatedTaxAmount = totalInclusivePrice - calculatedBasePrice;

    console.log("Tax-inclusive calculation:", {
      totalInclusivePrice: totalInclusivePrice / 100,
      taxRate: taxResult.taxRate,
      calculatedBasePrice: calculatedBasePrice / 100,
      calculatedTaxAmount: calculatedTaxAmount / 100,
    });

    return {
      success: true,
      basePrice: calculatedBasePrice,
      taxAmount: calculatedTaxAmount,
      totalPrice: totalInclusivePrice,
      taxRate: taxResult.taxRate,
      hasNexus: taxResult.hasNexus,
    };
  } catch (error) {
    console.error("Tax calculation error:", error);
    const totalPrice = items.reduce(
      (sum, item) => sum + item.totalPriceIncludingTax * item.quantity,
      0
    );
    return {
      success: false,
      basePrice: 0,
      taxAmount: 0,
      totalPrice,
      taxRate: 0,
      hasNexus: false,
      error: error instanceof Error ? error.message : "Tax calculation failed",
    };
  }
}

/**
 * Create TaxJar order with correct base price and tax amounts
 */
export function createTaxInclusiveOrderData(
  transactionId: string,
  billingAddress: BillingAddress,
  items: TaxInclusiveItem[],
  calculationResult: TaxInclusiveCalculationResult,
  shipping: number = 0,
  customerId?: string,
  transactionDate?: Date
) {
  // Convert to OrderItem format with calculated base prices
  const orderItems: OrderItem[] = items.map((item) => {
    const itemTotalInclusive = item.totalPriceIncludingTax * item.quantity;
    const itemBasePrice = Math.round(
      itemTotalInclusive / (1 + calculationResult.taxRate)
    );

    return {
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Math.round(itemBasePrice / item.quantity), // Base unit price
      type: item.type,
    };
  });

  return {
    transactionId,
    billingAddress,
    items: orderItems,
    taxAmount: calculationResult.taxAmount,
    shipping,
    customerId,
    transactionDate,
  };
}

/**
 * Example usage for your $99 course
 */
export function createCourseOrderExample(
  transactionId: string,
  billingAddress: BillingAddress,
  customerId?: string
): TaxInclusiveItem[] {
  return [
    {
      id: "course-001",
      description: "Cannabis Cultivation Course",
      quantity: 1,
      totalPriceIncludingTax: 9900, // $99.00 in cents (tax-inclusive)
      type: "course",
    },
  ];
}
