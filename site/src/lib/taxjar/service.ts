import {
  TaxJarConfig,
  TaxJarTaxRequest,
  TaxJarTaxResponse,
  TaxJarOrderRequest,
  TaxJarOrderResponse,
  TaxCalculationResult,
  OrderCreationResult,
} from "./types";
import { getTaxJarConfig } from "./config";

// Import TaxJar SDK
import Taxjar from "taxjar";

export class TaxJarService {
  private config: TaxJarConfig;
  private client: any;

  constructor(config?: TaxJarConfig) {
    this.config = config || getTaxJarConfig();
    if (process.env.NODE_ENV == "development") {
      console.log("API KEY ---->>> $", this.config.apiToken);
    }

    if (this.config.enabled && this.config.apiToken) {
      if (process.env.NODE_ENV == "development") {
        console.log("CHECK FOR ENABLE ---", this.config.enabled);
        console.log("CHECK FOR ENV ---", this.config.environment);
        console.log("CHECK FOR URL ---", Taxjar.SANDBOX_API_URL);
      }

      this.client = new Taxjar({
        apiKey: this.config.apiToken,
        apiUrl:
          this.config.environment === "sandbox"
            ? Taxjar.SANDBOX_API_URL
            : Taxjar.DEFAULT_API_URL,
      });
      this.client.setApiConfig("headers", {
        "x-api-version": "2022-01-24",
      });
    }
  }

  /**
   * Calculate tax for a transaction
   */
  async calculateTax(request: TaxJarTaxRequest): Promise<TaxCalculationResult> {
    try {
      if (!this.client) {
        throw new Error("TaxJar client not initialized");
      }

      const response = await this.client.taxForOrder(request);

      return {
        success: true,
        taxAmount: response.tax.amount_to_collect,
        taxRate: response.tax.rate,
        taxableAmount: response.tax.taxable_amount,
        hasNexus: response.tax.has_nexus,
        breakdown: response.tax.breakdown?.line_items,
      };
    } catch (error) {
      console.error("Tax calculation failed:", error);
      return {
        success: false,
        taxAmount: 0,
        taxRate: 0,
        taxableAmount: 0,
        hasNexus: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create an order transaction for reporting
   */
  async createOrder(request: TaxJarOrderRequest): Promise<OrderCreationResult> {
    try {
      if (!this.client) {
        throw new Error("TaxJar client not initialized");
      }

      const response = await this.client.createOrder(request);

      return {
        success: true,
        transactionId: response.transaction_id,
      };
    } catch (error) {
      console.error("Order creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update an existing order transaction
   */
  async updateOrder(
    transactionId: string,
    request: Partial<TaxJarOrderRequest>
  ): Promise<OrderCreationResult> {
    try {
      if (!this.client) {
        throw new Error("TaxJar client not initialized");
      }

      const response = await this.client.updateOrder({
        transaction_id: transactionId,
        ...request,
      });

      return {
        success: true,
        transactionId: response.transaction_id,
      };
    } catch (error) {
      console.error("Order update failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete an order transaction
   */
  async deleteOrder(transactionId: string): Promise<OrderCreationResult> {
    try {
      if (!this.client) {
        throw new Error("TaxJar client not initialized");
      }

      await this.client.deleteOrder(transactionId);

      return {
        success: true,
        transactionId,
      };
    } catch (error) {
      console.error("Order deletion failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Validate if TaxJar is properly configured
   */
  isConfigured(): boolean {
    return this.config.enabled && !!this.config.apiToken && !!this.client;
  }

  /**
   * Get configuration status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      environment: this.config.environment,
      configured: this.isConfigured(),
    };
  }
}

// Singleton instance
export const taxJarService = new TaxJarService();
