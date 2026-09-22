// TaxJar Integration - Main Export File
export { TaxJarService, taxJarService } from './service';
export { getTaxJarConfig, TAXJAR_BASE_URL, TAXJAR_ENDPOINTS, DEFAULT_FROM_ADDRESS, PRODUCT_TAX_CODES } from './config';
export {
  createTaxCalculationRequest,
  createOrderRequest,
  isValidUSState,
  isValidUSZip,
  formatTaxAmount,
  formatTaxRate,
  shouldCalculateTax,
} from './utils';
export {
  calculateTaxInclusive,
  createTaxInclusiveOrderData,
  createCourseOrderExample,
} from './tax-inclusive-utils';
export type {
  TaxJarConfig,
  TaxJarAddress,
  TaxJarLineItem,
  TaxJarTaxRequest,
  TaxJarTaxResponse,
  TaxJarOrderRequest,
  TaxJarOrderResponse,
  TaxCalculationResult,
  OrderCreationResult,
} from './types';
export type { BillingAddress, OrderItem } from './utils';
export type { TaxInclusiveItem, TaxInclusiveCalculationResult } from './tax-inclusive-utils';