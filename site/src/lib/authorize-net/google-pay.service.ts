import {
  AuthorizeNetConfig,
  BillingInfo,
  SubscriptionResult,
  GooglePayData,
  GooglePayTransactionResult,
} from "./types";

const ApiContracts = require("authorizenet").APIContracts;
const ApiControllers = require("authorizenet").APIControllers;
const Constants = require("authorizenet").Constants;

export interface GooglePaySubscriptionData {
  name: string;
  amount: number;
  intervalLength: number;
  intervalUnit: "days" | "months";
  totalOccurrences: number;
  startDate: Date;
  googlePayData: GooglePayData;
  billingInfo: BillingInfo;
  customer?: {
    type?: string;
    id?: string;
    email?: string;
    phoneNumber?: string;
    description?: string;
  };
  order?: {
    invoiceNumber?: string;
    description?: string;
  };
}

export class AuthorizeNetGooglePayService {
  private config: AuthorizeNetConfig;

  constructor(config: AuthorizeNetConfig) {
    this.config = config;
  }

  async createGooglePaySubscription(
    subscriptionData: GooglePaySubscriptionData
  ): Promise<SubscriptionResult> {
    return new Promise((resolve) => {
      try {
        // Merchant authentication
        const merchantAuth = new ApiContracts.MerchantAuthenticationType();
        merchantAuth.setName(this.config.apiLoginId);
        merchantAuth.setTransactionKey(this.config.transactionKey);

        console.log(
          `[GOOGLE PAY DATA] -- ${JSON.stringify(
            subscriptionData.googlePayData,
            null,
            2
          )}`
        );

        // Google Pay opaque data
        const opaqueData = new ApiContracts.OpaqueDataType();
        opaqueData.setDataDescriptor(
          subscriptionData.googlePayData.opaqueDataDescriptor
        );
        opaqueData.setDataValue(subscriptionData.googlePayData.opaqueDataValue);

        const payment = new ApiContracts.PaymentType();
        payment.setOpaqueData(opaqueData);

        // Payment schedule
        const interval = new ApiContracts.PaymentScheduleType.Interval();
        interval.setLength(subscriptionData.intervalLength);
        interval.setUnit(
          subscriptionData.intervalUnit === "months"
            ? ApiContracts.ARBSubscriptionUnitEnum.MONTHS
            : ApiContracts.ARBSubscriptionUnitEnum.DAYS
        );

        const paymentSchedule = new ApiContracts.PaymentScheduleType();
        paymentSchedule.setInterval(interval);
        paymentSchedule.setStartDate(
          this.formatDate(subscriptionData.startDate)
        );
        paymentSchedule.setTotalOccurrences(
          subscriptionData.totalOccurrences ?? 1
        );

        // Billing information
        const billTo = new ApiContracts.NameAndAddressType();
        billTo.setFirstName(subscriptionData.billingInfo.firstName);
        billTo.setLastName(subscriptionData.billingInfo.lastName);
        billTo.setAddress(subscriptionData.billingInfo.address);
        billTo.setCity(subscriptionData.billingInfo.city);
        billTo.setState(subscriptionData.billingInfo.state);
        billTo.setZip(subscriptionData.billingInfo.zip);
        billTo.setCountry(subscriptionData.billingInfo.country || "US");

        // Customer information
        const customer = new ApiContracts.CustomerType();
        customer.setType(ApiContracts.CustomerTypeEnum.INDIVIDUAL);
        // Generate short customer ID (max 8 chars for Authorize.Net)
        const shortId =
          subscriptionData.customer?.id ||
          `gp${Math.random().toString(36).substr(2, 6)}`;
        customer.setId(shortId);
        customer.setEmail(
          subscriptionData.customer?.email || subscriptionData.billingInfo.email
        );
        if (subscriptionData.customer?.phoneNumber) {
          customer.setPhoneNumber(subscriptionData.customer.phoneNumber);
        }

        // Order information
        const order = new ApiContracts.OrderType();
        // Generate short invoice number (max 8 chars)
        const shortInvoice =
          subscriptionData.order?.invoiceNumber ||
          `GP${Math.random().toString(36).substr(2, 6)}`;
        order.setInvoiceNumber(shortInvoice);
        order.setDescription(
          subscriptionData.order?.description ||
            `Google Pay - ${subscriptionData.name}`
        );

        // Subscription
        const subscription = new ApiContracts.ARBSubscriptionType();
        subscription.setName(subscriptionData.name);
        subscription.setPaymentSchedule(paymentSchedule);
        subscription.setAmount((subscriptionData.amount / 100).toFixed(2));
        subscription.setPayment(payment);
        subscription.setOrder(order);
        subscription.setCustomer(customer);
        subscription.setBillTo(billTo);
        subscription.setShipTo(billTo);

        // Create subscription request
        const createRequest = new ApiContracts.ARBCreateSubscriptionRequest();
        createRequest.setMerchantAuthentication(merchantAuth);
        createRequest.setSubscription(subscription);

        const ctrl = new ApiControllers.ARBCreateSubscriptionController(
          createRequest.getJSON()
        );

        if (process.env.AUTHORIZE_NET_ENVIRONMENT === "production") {
          ctrl.setEnvironment(Constants.endpoint.production);
        } else {
          ctrl.setEnvironment(Constants.endpoint.sandbox);
        }

        ctrl.execute(() => {
          const apiResponse = ctrl.getResponse();

          if (!apiResponse) {
            console.log("[GOOGLE PAY SUBSCRIPTION] No API response received");
            resolve({
              success: false,
              errors: ["No response from Authorize.net"],
            });
            return;
          }

          console.log("[GOOGLE PAY SUBSCRIPTION] Processing response...");
          const response = new ApiContracts.ARBCreateSubscriptionResponse(
            apiResponse
          );

          if (
            response.getMessages().getResultCode() ===
            ApiContracts.MessageTypeEnum.OK
          ) {
            resolve({
              success: true,
              subscriptionId: response.getSubscriptionId(),
              customerProfileId:
                response.getProfile()?.getCustomerProfileId() || undefined,
              paymentProfileId: undefined,
              responseMessage:
                response.getMessages().getMessage()?.[0]?.getText() ||
                "Google Pay subscription created successfully",
            });
            console.log("[GOOGLE PAY SUBSCRIPTION] Resolved with success!");
          } else {
            console.log(
              "[GOOGLE PAY SUBSCRIPTION] Error in response:",
              response.getMessages().getMessage()
            );
            const messages = response.getMessages().getMessage() || [];
            resolve({
              success: false,
              errors: messages.map((msg: any) => msg.getText()),
            });
          }
        });
      } catch (error) {
        console.log("[GOOGLE PAY SUBSCRIPTION] Exception caught:", error);
        resolve({
          success: false,
          errors: [error instanceof Error ? error.message : "Unknown error"],
        });
      }
    });
  }

  async createGooglePayTransaction(
    googlePayData: GooglePayData,
    amount: number,
    billingInfo: BillingInfo,
    orderInfo?: {
      invoiceNumber?: string;
      description?: string;
    }
  ): Promise<GooglePayTransactionResult> {
    return new Promise((resolve) => {
      try {
        // Merchant authentication
        const merchantAuth = new ApiContracts.MerchantAuthenticationType();
        merchantAuth.setName(this.config.apiLoginId);
        merchantAuth.setTransactionKey(this.config.transactionKey);

        // Google Pay opaque data
        const opaqueData = new ApiContracts.OpaqueDataType();
        opaqueData.setDataDescriptor(googlePayData.opaqueDataDescriptor);
        opaqueData.setDataValue(googlePayData.opaqueDataValue);

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
        // Generate short invoice number (max 8 chars)
        const shortInvoice =
          orderInfo?.invoiceNumber ||
          `GP${Math.random().toString(36).substr(2, 6)}`;
        order.setInvoiceNumber(shortInvoice);
        order.setDescription(
          orderInfo?.description || "Google Pay Transaction"
        );

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
        if (process.env.AUTHORIZE_NET_ENVIRONMENT === "production") {
          ctrl.setEnvironment(Constants.endpoint.production);
        } else {
          ctrl.setEnvironment(Constants.endpoint.sandbox);
        }
        ctrl.execute(() => {
          const apiResponse = ctrl.getResponse();

          if (!apiResponse) {
            resolve({
              success: false,
              errors: ["No response from Authorize.net"],
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
            if (response.getTransactionResponse().getMessages() != null) {
              resolve({
                success: true,
                transactionId: response.getTransactionResponse().getTransId(),
                responseCode: response
                  .getTransactionResponse()
                  .getResponseCode(),
                responseMessage:
                  response
                    .getTransactionResponse()
                    .getMessages()
                    .getMessage()[0]
                    .getDescription() || "Google Pay transaction successful",
              });
            } else {
              const errors = response.getTransactionResponse().getErrors();
              resolve({
                success: false,
                errors: errors
                  ? [errors.getError()[0].getErrorText()]
                  : ["Transaction failed"],
              });
            }
          } else {
            const messages = response.getMessages().getMessage() || [];
            resolve({
              success: false,
              errors: messages.map((msg: any) => msg.getText()),
            });
          }
        });
      } catch (error) {
        resolve({
          success: false,
          errors: [error instanceof Error ? error.message : "Unknown error"],
        });
      }
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
