import { TaxJarConfig } from "./types";

export const getTaxJarConfig = (): TaxJarConfig => {
  return {
    apiToken: process.env.TAXJAR_API_TOKEN || "",
    environment:
      (process.env.TAXJAR_ENVIRONMENT as "sandbox" | "production") || "sandbox",
    enabled: process.env.TAXJAR_ENABLED === "true",
  };
};

export const TAXJAR_BASE_URL = {
  sandbox: "https://api.sandbox.taxjar.com",
  production: "https://api.taxjar.com",
};

export const TAXJAR_ENDPOINTS = {
  TAX_CALCULATION: "/v2/taxes",
  ORDER_CREATION: "/v2/transactions/orders",
  ORDER_UPDATE: "/v2/transactions/orders",
  ORDER_DELETE: "/v2/transactions/orders",
  NEXUS_REGIONS: "/v2/nexus/regions",
  VALIDATE_ADDRESS: "/v2/addresses/validate",
} as const;

// Default company address (IMPORTANT: Update with your actual business address)
export const DEFAULT_FROM_ADDRESS = {
  country: "US",
  zip: "43081", // Columbus, OH ZIP
  state: "OH", // Ohio state
  city: "Columbus", // Columbus city
  street: "3296 Westerville Road", // Business street address
};

// Product tax codes for different types of products
export const PRODUCT_TAX_CODES = {
  DIGITAL_GOODS: "31000", // Digital goods/services (often tax-exempt)
  SOFTWARE: "31000", // Software
  COURSES: "31000", // Training Services - Services provided to educate users
  SUBSCRIPTION: "31000", // Training Services - Educational subscription services
  GENERAL_TAXABLE: "31000", // General taxable goods
} as const;
