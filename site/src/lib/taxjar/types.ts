// TaxJar API Types
export interface TaxJarConfig {
  apiToken: string;
  environment: 'sandbox' | 'production';
  enabled: boolean;
}

export interface TaxJarAddress {
  country: string;
  zip: string;
  state: string;
  city?: string;
  street?: string;
}

export interface TaxJarLineItem {
  id?: string;
  quantity: number;
  product_tax_code?: string;
  unit_price: number;
  discount?: number;
  description?: string;
}

export interface TaxJarTaxRequest {
  from_country: string;
  from_zip: string;
  from_state: string;
  from_city?: string;
  from_street?: string;
  to_country: string;
  to_zip: string;
  to_state: string;
  to_city?: string;
  to_street?: string;
  amount?: number;
  shipping: number;
  customer_id?: string;
  exemption_type?: string;
  nexus_addresses?: TaxJarNexusAddress[];
  line_items?: TaxJarLineItem[];
}

export interface TaxJarNexusAddress {
  id?: string;
  country: string;
  zip: string;
  state: string;
  city?: string;
  street?: string;
}

export interface TaxJarTaxResponse {
  tax: {
    order_total_amount: number;
    shipping: number;
    taxable_amount: number;
    amount_to_collect: number;
    rate: number;
    has_nexus: boolean;
    freight_taxable: boolean;
    tax_source: string;
    exemption_type?: string;
    jurisdictions: {
      country: string;
      state: string;
      county?: string;
      city?: string;
    };
    breakdown?: {
      taxable_amount: number;
      tax_collectable: number;
      combined_tax_rate: number;
      state_taxable_amount: number;
      state_tax_rate: number;
      state_tax_collectable: number;
      county_taxable_amount?: number;
      county_tax_rate?: number;
      county_tax_collectable?: number;
      city_taxable_amount?: number;
      city_tax_rate?: number;
      city_tax_collectable?: number;
      special_district_taxable_amount?: number;
      special_tax_rate?: number;
      special_district_tax_collectable?: number;
      line_items?: TaxJarLineItemBreakdown[];
    };
  };
}

export interface TaxJarLineItemBreakdown {
  id: string;
  taxable_amount: number;
  tax_collectable: number;
  combined_tax_rate: number;
  state_taxable_amount: number;
  state_sales_tax_rate: number;
  state_amount: number;
  county_taxable_amount?: number;
  county_tax_rate?: number;
  county_amount?: number;
  city_taxable_amount?: number;
  city_tax_rate?: number;
  city_amount?: number;
  special_district_taxable_amount?: number;
  special_tax_rate?: number;
  special_district_amount?: number;
}

export interface TaxJarOrderRequest {
  transaction_id: string;
  transaction_date: string;
  provider?: string;
  from_country: string;
  from_zip: string;
  from_state: string;
  from_city?: string;
  from_street?: string;
  to_country: string;
  to_zip: string;
  to_state: string;
  to_city?: string;
  to_street?: string;
  amount: number;
  shipping: number;
  sales_tax: number;
  customer_id?: string;
  exemption_type?: string;
  line_items?: TaxJarLineItem[];
}

export interface TaxJarOrderResponse {
  order: {
    transaction_id: string;
    user_id: number;
    transaction_date: string;
    provider: string;
    exemption_type?: string;
    from_country: string;
    from_zip: string;
    from_state: string;
    from_city?: string;
    from_street?: string;
    to_country: string;
    to_zip: string;
    to_state: string;
    to_city?: string;
    to_street?: string;
    amount: string;
    shipping: string;
    sales_tax: string;
    line_items?: TaxJarLineItem[];
  };
}

export interface TaxCalculationResult {
  success: boolean;
  taxAmount: number;
  taxRate: number;
  taxableAmount: number;
  hasNexus: boolean;
  breakdown?: TaxJarLineItemBreakdown[];
  error?: string;
}

export interface OrderCreationResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}