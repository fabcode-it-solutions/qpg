import {
  AuthorizeNetConfig,
  BillingInfo,
  GooglePayTransactionResult,
} from "./types";

const ApiContracts = require("authorizenet").APIContracts;
const ApiControllers = require("authorizenet").APIControllers;
const Constants = require("authorizenet").Constants;

export interface ApplePayData {
  opaqueDataDescriptor: string; // "COMMON.APPLE.INAPP.PAYMENT"
  opaqueDataValue: string; // Base64 encoded payment data from Apple Pay
}

export class AuthorizeNetApplePayService {
  private config: AuthorizeNetConfig;

  constructor(config: AuthorizeNetConfig) {
    this.config = config;
  }

  /**
   * Create one-time Apple Pay transaction
   * Used for: Single payment without subscription
   */
  async createApplePayTransaction(
    applePayData: ApplePayData,
    amount: number,
    billingInfo: BillingInfo,
    orderInfo?: {
      invoiceNumber?: string;
      description?: string;
    }
  ): Promise<GooglePayTransactionResult> {
    return new Promise((resolve) => {
      try {
        console.log("[APPLE_PAY] Creating transaction:", {
          amount,
          environment: this.config.environment,
        });

        // Merchant authentication
        const merchantAuth = new ApiContracts.MerchantAuthenticationType();
        merchantAuth.setName(this.config.apiLoginId);
        merchantAuth.setTransactionKey(this.config.transactionKey);

        // Apple Pay opaque data
        const opaqueData = new ApiContracts.OpaqueDataType();
        opaqueData.setDataDescriptor(applePayData.opaqueDataDescriptor);
        opaqueData.setDataValue(applePayData.opaqueDataValue);

        const payment = new ApiContracts.PaymentType();
        payment.setOpaqueData(opaqueData);

        // Billing information
        const billTo = new ApiContracts.CustomerAddressType();
        billTo.setFirstName(billingInfo.firstName);
        billTo.setLastName(billingInfo.lastName);
        billTo.setAddress(billingInfo.address);
        billTo.setCity(billingInfo.city);
        billTo.setState(billingInfo.state);
        billTo.setZip(billingInfo.zip);
        billTo.setCountry(billingInfo.country || "US");

        // Order information
        const order = new ApiContracts.OrderType();
        const shortInvoice =
          orderInfo?.invoiceNumber ||
          `AP${Math.random().toString(36).substr(2, 6)}`;
        order.setInvoiceNumber(shortInvoice);
        order.setDescription(orderInfo?.description || "Apple Pay Transaction");

        // Transaction request
        const transactionRequest = new ApiContracts.TransactionRequestType();
        transactionRequest.setAmount((amount / 100).toFixed(2));
        transactionRequest.setTransactionType(
          ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
        );
        transactionRequest.setPayment(payment);
        transactionRequest.setBillTo(billTo);
        transactionRequest.setOrder(order);

        // Create transaction request
        const createRequest = new ApiContracts.CreateTransactionRequest();
        createRequest.setTransactionRequest(transactionRequest);
        createRequest.setMerchantAuthentication(merchantAuth);

        const ctrl = new ApiControllers.CreateTransactionController(
          createRequest.getJSON()
        );

        // Set environment
        if (this.config.environment === "production") {
          ctrl.setEnvironment(Constants.endpoint.production);
        } else {
          ctrl.setEnvironment(Constants.endpoint.sandbox);
        }

        ctrl.execute(() => {
          const apiResponse = ctrl.getResponse();

          if (!apiResponse) {
            console.error("[APPLE_PAY] No API response received");
            resolve({
              success: false,
              errors: ["No response from Authorize.Net"],
            });
            return;
          }

          const response = new ApiContracts.CreateTransactionResponse(
            apiResponse
          );

          if (
            response.getMessages().getResultCode() ===
            ApiContracts.MessageTypeEnum.OK
          ) {
            const transResponse = response.getTransactionResponse();

            if (!transResponse) {
              console.error("[APPLE_PAY] No transaction response");
              resolve({
                success: false,
                errors: ["No transaction response"],
              });
              return;
            }

            if (
              transResponse.getResponseCode() === "1" &&
              transResponse.getMessages()
            ) {
              console.log("[APPLE_PAY] Transaction approved:", {
                transactionId: transResponse.getTransId(),
                responseCode: transResponse.getResponseCode(),
              });

              resolve({
                success: true,
                transactionId: transResponse.getTransId(),
                responseCode: transResponse.getResponseCode(),
                responseMessage: transResponse
                  .getMessages()
                  .getMessage()[0]
                  .getDescription(),
                customerProfileId: response
                  .getProfileResponse()
                  ?.getCustomerProfileId(),
                paymentProfileId: response
                  .getProfileResponse()
                  ?.getCustomerPaymentProfileIdList()?.[0],
              });
            } else {
              const errors = transResponse.getErrors()
                ? transResponse
                    .getErrors()
                    .getError()
                    .map(
                      (err: any) =>
                        `[${err.getErrorCode()}] ${err.getErrorText()}`
                    )
                : ["Transaction failed"];

              console.error("[APPLE_PAY] Transaction failed:", errors);
              resolve({
                success: false,
                errors,
              });
            }
          } else {
            const messages = response.getMessages().getMessage();
            const errors = messages.map(
              (msg: any) => `[${msg.getCode()}] ${msg.getText()}`
            );

            console.error("[APPLE_PAY] API error:", errors);
            resolve({
              success: false,
              errors,
            });
          }
        });
      } catch (error) {
        console.error("[APPLE_PAY] Exception:", error);
        resolve({
          success: false,
          errors: [error instanceof Error ? error.message : "Unknown error"],
        });
      }
    });
  }

  /**
   * Validate Apple Pay payment data before processing
   */
  validateApplePayData(applePayData: ApplePayData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check descriptor
    if (!applePayData.opaqueDataDescriptor) {
      errors.push("Missing opaqueDataDescriptor");
    } else if (
      applePayData.opaqueDataDescriptor !== "COMMON.APPLE.INAPP.PAYMENT"
    ) {
      errors.push(
        `Invalid descriptor: ${applePayData.opaqueDataDescriptor}. Expected: COMMON.APPLE.INAPP.PAYMENT`
      );
    }

    // Check data value
    if (!applePayData.opaqueDataValue) {
      errors.push("Missing opaqueDataValue");
    } else if (applePayData.opaqueDataValue.length < 50) {
      errors.push("opaqueDataValue appears to be too short");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
