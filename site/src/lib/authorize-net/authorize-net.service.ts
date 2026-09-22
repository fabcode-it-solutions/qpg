import { AuthorizeNetTransactionService } from "./transaction.service";
import { AuthorizeNetSubscriptionService } from "./subscription.service";
import { AuthorizeNetGooglePayService } from "./google-pay.service";
import {
  AuthorizeNetConfig,
  PaymentData,
  BillingInfo,
  TransactionResult,
  SubscriptionData,
  SubscriptionResult,
  GooglePayData,
  GooglePayTransactionResult,
} from "./types";
import { ApplePayData, AuthorizeNetApplePayService } from "./apple-pay.service";

export class AuthorizeNetService {
  private config: AuthorizeNetConfig;
  private transactionService: AuthorizeNetTransactionService;
  private subscriptionService: AuthorizeNetSubscriptionService;
  private googlePayService: AuthorizeNetGooglePayService;
  private applePayService: AuthorizeNetApplePayService;
  constructor() {
    this.config = {
      apiLoginId: process.env.AUTHORIZE_NET_API_LOGIN_ID || "",
      transactionKey: process.env.AUTHORIZE_NET_TRANSACTION_KEY || "",
      environment: process.env.AUTHORIZE_NET_ENVIRONMENT as
        | "sandbox"
        | "production",
    };

    this.transactionService = new AuthorizeNetTransactionService(this.config);
    this.subscriptionService = new AuthorizeNetSubscriptionService(this.config);
    this.googlePayService = new AuthorizeNetGooglePayService(this.config);
    this.applePayService = new AuthorizeNetApplePayService(this.config);
  }

  async createTransaction(
    opaqueData: any,
    amount: number,
    billingInfo: any
  ): Promise<TransactionResult> {
    const paymentData: PaymentData = {
      opaqueDataDescriptor: opaqueData.dataDescriptor,
      opaqueDataValue: opaqueData.dataValue,
    };

    const billing: BillingInfo = {
      firstName: billingInfo.firstName,
      lastName: billingInfo.lastName,
      email: billingInfo.email,
      address: billingInfo.address,
      city: billingInfo.city,
      state: billingInfo.state,
      zip: billingInfo.zip,
      country: billingInfo.country || "US",
    };

    return this.transactionService.createTransaction(
      paymentData,
      amount,
      billing
    );
  }

  async captureTransaction(transactionId: string): Promise<TransactionResult> {
    return this.transactionService.captureTransaction(transactionId);
  }

  async createSubscription(subscriptionData: any): Promise<SubscriptionResult> {
    const data: SubscriptionData = {
      name: subscriptionData.name,
      amount: subscriptionData.amount,
      intervalLength: subscriptionData.intervalLength || 12,
      intervalUnit: subscriptionData.intervalUnit || "months",
      totalOccurrences: 1,
      startDate: subscriptionData.startDate || new Date(),
      paymentData: {
        opaqueDataDescriptor: subscriptionData.opaqueData.dataDescriptor,
        opaqueDataValue: subscriptionData.opaqueData.dataValue,
      },
      billingInfo: subscriptionData.billTo,
      customer: subscriptionData.customer,
      order: subscriptionData.order,
    };

    return this.subscriptionService.createSubscription(data);
  }

  async cancelSubscription(
    subscriptionId: string
  ): Promise<SubscriptionResult> {
    return this.subscriptionService.cancelSubscription(subscriptionId);
  }

  async getCustomerProfile(customerProfileId: string): Promise<any> {
    return this.subscriptionService.getCustomerProfile(customerProfileId);
  }

  // Google Pay methods
  async createGooglePayTransaction(
    googlePayData: GooglePayData,
    amount: number,
    billingInfo: BillingInfo
  ): Promise<GooglePayTransactionResult> {
    return this.googlePayService.createGooglePayTransaction(
      googlePayData,
      amount,
      billingInfo
    );
  }

  async createGooglePaySubscription(
    subscriptionData: any
  ): Promise<SubscriptionResult> {
    return this.googlePayService.createGooglePaySubscription(subscriptionData);
  }
  /**
   * Create an Apple Pay transaction
   */
  async createApplePayTransaction(
    applePayData: ApplePayData,
    amount: number,
    billingInfo: any,
    orderInfo?: {
      invoiceNumber?: string;
      description?: string;
    }
  ): Promise<GooglePayTransactionResult> {
    const billing: BillingInfo = {
      firstName: billingInfo.firstName,
      lastName: billingInfo.lastName,
      email: billingInfo.email,
      address: billingInfo.address,
      city: billingInfo.city,
      state: billingInfo.state,
      zip: billingInfo.zip,
      country: billingInfo.country || "US",
    };

    return this.applePayService.createApplePayTransaction(
      applePayData,
      amount,
      billing,
      orderInfo
    );
  }

  /**
   * Validate Apple Pay data before processing
   */
  validateApplePayData(applePayData: ApplePayData): {
    isValid: boolean;
    errors: string[];
  } {
    return this.applePayService.validateApplePayData(applePayData);
  }
}
