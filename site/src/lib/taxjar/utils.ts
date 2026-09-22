import { TaxJarTaxRequest, TaxJarOrderRequest, TaxJarLineItem } from "./types";
import { DEFAULT_FROM_ADDRESS, PRODUCT_TAX_CODES } from "./config";

export interface BillingAddress {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // in cents
  discount?: number; // in cents
  type?: "course" | "subscription" | "digital" | "software";
}

/**
 * Create TaxJar tax calculation request from order data
 */
export function createTaxCalculationRequest(
  billingAddress: BillingAddress,
  items: OrderItem[],
  shipping: number = 0,
  customerId?: string
): TaxJarTaxRequest {
  const lineItems: TaxJarLineItem[] = items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    unit_price: item.unitPrice / 100, // Convert cents to dollars
    discount: item.discount ? item.discount / 100 : 0,
    description: item.description,
    product_tax_code: getProductTaxCode(item.type),
  }));

  // Calculate total amount from line items
  const amount = lineItems.reduce(
    (sum, item) => sum + item.unit_price * item.quantity - (item.discount || 0),
    0
  );

  return {
    from_country: DEFAULT_FROM_ADDRESS.country,
    from_zip: DEFAULT_FROM_ADDRESS.zip,
    from_state: DEFAULT_FROM_ADDRESS.state,
    from_city: DEFAULT_FROM_ADDRESS.city,
    from_street: DEFAULT_FROM_ADDRESS.street,
    to_country: billingAddress.country || "US",
    to_zip: billingAddress.zip,
    to_state: billingAddress.state,
    to_city: billingAddress.city,
    to_street: billingAddress.address,
    amount: amount, // Total amount in dollars
    shipping: shipping / 100, // Convert cents to dollars
    nexus_addresses: [
      {
        id: "Main Location",
        country: DEFAULT_FROM_ADDRESS.country,
        zip: DEFAULT_FROM_ADDRESS.zip,
        state: DEFAULT_FROM_ADDRESS.state,
        city: DEFAULT_FROM_ADDRESS.city,
        street: DEFAULT_FROM_ADDRESS.street,
      },
    ],
    line_items: lineItems,
  };
}

/**
 * Create TaxJar order request for transaction reporting
 */
export function createOrderRequest(
  transactionId: string,
  billingAddress: BillingAddress,
  items: OrderItem[],
  taxAmount: number,
  shipping: number = 0,
  customerId?: string,
  transactionDate?: Date
): TaxJarOrderRequest {
  const lineItems: TaxJarLineItem[] = items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    unit_price: item.unitPrice / 100, // Convert cents to dollars
    discount: item.discount ? item.discount / 100 : 0,
    description: item.description,
    product_tax_code: getProductTaxCode(item.type),
  }));

  const totalAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity - (item.discount || 0),
    0
  );

  return {
    transaction_id: transactionId,
    transaction_date: (transactionDate || new Date())
      .toISOString()
      .split("T")[0],
    provider: "api",
    from_country: DEFAULT_FROM_ADDRESS.country,
    // from_zip: DEFAULT_FROM_ADDRESS.zip,
    // from_state: DEFAULT_FROM_ADDRESS.state,
    // from_city: DEFAULT_FROM_ADDRESS.city,
    // from_street: DEFAULT_FROM_ADDRESS.street,
    from_zip: "92093",
    from_state: "CA",
    from_city: "La Jolla",
    from_street: "9500 Gilman Drive",
    to_country: billingAddress.country || "US",
    to_zip: billingAddress.zip,
    to_state: billingAddress.state,
    to_city: billingAddress.city,
    to_street: billingAddress.address,
    amount: totalAmount / 100, // Convert cents to dollars
    shipping: shipping / 100, // Convert cents to dollars
    sales_tax: taxAmount / 100, // Convert cents to dollars
    customer_id: customerId,
    line_items: lineItems,
  };
}

/**
 * Get appropriate product tax code based on item type
 */
function getProductTaxCode(type?: string): string {
  switch (type) {
    case "course":
      return PRODUCT_TAX_CODES.COURSES; // Now uses 20010 (taxable)
    case "subscription":
      return PRODUCT_TAX_CODES.SUBSCRIPTION; // Now uses 20010 (taxable)
    case "software":
      return PRODUCT_TAX_CODES.SOFTWARE;
    case "digital":
    default:
      return PRODUCT_TAX_CODES.GENERAL_TAXABLE; // Use general taxable instead of digital
  }
}

/**
 * Validate US state code
 */
export function isValidUSState(state: string): boolean {
  const validStates = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
    "DC",
  ];
  return validStates.includes(state.toUpperCase());
}

/**
 * Validate US ZIP code
 */
export function isValidUSZip(zip: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
}

/**
 * Format tax amount for display
 */
export function formatTaxAmount(amountInCents: number): string {
  return (amountInCents / 100).toFixed(2);
}

/**
 * Format tax rate for display
 */
export function formatTaxRate(rate: number): string {
  return (rate * 100).toFixed(2) + "%";
}

/**
 * Check if address requires tax calculation (US only for now)
 */
export function shouldCalculateTax(billingAddress: BillingAddress): boolean {
  const country = billingAddress.country || "US";
  return (
    country === "US" &&
    isValidUSState(billingAddress.state) &&
    isValidUSZip(billingAddress.zip)
  );
}
