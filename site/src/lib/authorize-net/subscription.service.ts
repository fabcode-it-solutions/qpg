import {
  AuthorizeNetConfig,
  SubscriptionData,
  SubscriptionResult,
} from "./types";

const ApiContracts = require("authorizenet").APIContracts;
const ApiControllers = require("authorizenet").APIControllers;
const Constants = require("authorizenet").Constants;

export class AuthorizeNetSubscriptionService {
  private config: AuthorizeNetConfig;

  constructor(config: AuthorizeNetConfig) {
    this.config = config;
  }

  async createSubscription(
    subscriptionData: SubscriptionData
  ): Promise<SubscriptionResult> {
    return new Promise((resolve) => {
      try {
        // Merchant authentication
        const merchantAuth = new ApiContracts.MerchantAuthenticationType();
        merchantAuth.setName(this.config.apiLoginId);
        merchantAuth.setTransactionKey(this.config.transactionKey);

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

        // Payment using opaque data
        const opaqueData = new ApiContracts.OpaqueDataType();
        opaqueData.setDataDescriptor(
          subscriptionData.paymentData.opaqueDataDescriptor
        );
        opaqueData.setDataValue(subscriptionData.paymentData.opaqueDataValue);

        const payment = new ApiContracts.PaymentType();
        payment.setOpaqueData(opaqueData);

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
        customer.setId(subscriptionData.customer?.id || `cust_${Date.now()}`);
        customer.setEmail(
          subscriptionData.customer?.email || subscriptionData.billingInfo.email
        );
        if (subscriptionData.customer?.phoneNumber) {
          customer.setPhoneNumber(subscriptionData.customer.phoneNumber);
        }

        // Order information
        const order = new ApiContracts.OrderType();
        order.setInvoiceNumber(
          subscriptionData.order?.invoiceNumber || `INV-${Date.now()}`
        );
        order.setDescription(
          subscriptionData.order?.description || subscriptionData.name
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
        subscription.setShipTo(billTo); // Same as billing for digital products

        // Create subscription request
        const createRequest = new ApiContracts.ARBCreateSubscriptionRequest();
        createRequest.setMerchantAuthentication(merchantAuth);
        createRequest.setSubscription(subscription);

        const ctrl = new ApiControllers.ARBCreateSubscriptionController(
          createRequest.getJSON()
        );
        console.log(process.env.AUTHORIZE_NET_ENVIRONMENT);
        if (process.env.AUTHORIZE_NET_ENVIRONMENT === "production") {
          ctrl.setEnvironment(Constants.endpoint.production);
        } else {
          ctrl.setEnvironment(Constants.endpoint.sandbox);
        }

        ctrl.execute(() => {
          const apiResponse = ctrl.getResponse();

          if (!apiResponse) {
            console.log("[SUBSCRIPTION] No API response received");
            resolve({
              success: false,
              errors: ["No response from Authorize.net"],
            });
            return;
          }

          console.log("[SUBSCRIPTION] Processing response...");
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
              paymentProfileId: undefined, // Skip for now to avoid performance issues
              responseMessage:
                response.getMessages().getMessage()?.[0]?.getText() ||
                "Subscription created successfully",
            });
            console.log("[SUBSCRIPTION] Resolved with success!");
          } else {
            console.log(
              "[SUBSCRIPTION] Error in response:",
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
        console.log("[SUBSCRIPTION] Exception caught:", error);
        resolve({
          success: false,
          errors: [error instanceof Error ? error.message : "Unknown error"],
        });
      }
    });
  }

  async cancelSubscription(
    subscriptionId: string
  ): Promise<SubscriptionResult> {
    return new Promise((resolve) => {
      try {
        // Merchant authentication
        const merchantAuth = new ApiContracts.MerchantAuthenticationType();
        merchantAuth.setName(this.config.apiLoginId);
        merchantAuth.setTransactionKey(this.config.transactionKey);

        // Cancel subscription request
        const cancelRequest = new ApiContracts.ARBCancelSubscriptionRequest();
        cancelRequest.setMerchantAuthentication(merchantAuth);
        cancelRequest.setSubscriptionId(subscriptionId);

        // Execute cancellation
        const ctrl = new ApiControllers.ARBCancelSubscriptionController(
          cancelRequest.getJSON()
        );

        ctrl.execute(() => {
          const apiResponse = ctrl.getResponse();

          if (!apiResponse) {
            resolve({
              success: false,
              errors: ["No response from Authorize.net"],
            });
            return;
          }

          const response = new ApiContracts.ARBCancelSubscriptionResponse(
            apiResponse
          );

          if (
            response.getMessages().getResultCode() ===
            ApiContracts.MessageTypeEnum.OK
          ) {
            resolve({
              success: true,
              responseMessage:
                response.getMessages().getMessage()?.[0]?.getText() ||
                "Subscription cancelled successfully",
            });
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

  async getCustomerProfile(customerProfileId: string): Promise<any> {
    return new Promise((resolve) => {
      const merchantAuth = new ApiContracts.MerchantAuthenticationType();
      merchantAuth.setName(this.config.apiLoginId);
      merchantAuth.setTransactionKey(this.config.transactionKey);

      const getRequest = new ApiContracts.GetCustomerProfileRequest();
      getRequest.setMerchantAuthentication(merchantAuth);
      getRequest.setCustomerProfileId(customerProfileId);

      const ctrl = new ApiControllers.GetCustomerProfileController(
        getRequest.getJSON()
      );

      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();

        if (!apiResponse) {
          resolve({
            success: false,
            errors: ["No response from Authorize.net"],
          });
          return;
        }

        const response = new ApiContracts.GetCustomerProfileResponse(
          apiResponse
        );

        if (
          response.getMessages().getResultCode() ===
          ApiContracts.MessageTypeEnum.OK
        ) {
          const profile = response.getProfile();
          const paymentProfiles = profile.getPaymentProfiles();
          const paymentProfileId =
            paymentProfiles?.[0]?.getCustomerPaymentProfileId();

          resolve({
            success: true,
            customerProfileId: profile.getCustomerProfileId(),
            paymentProfileId,
            paymentProfiles: paymentProfiles?.map((pp: any) => ({
              id: pp.getCustomerPaymentProfileId(),
              cardLast4: pp
                .getPayment()
                ?.getCreditCard()
                ?.getCardNumber()
                ?.slice(-4),
              cardType: pp.getPayment()?.getCreditCard()?.getCardType(),
            })),
          });
        } else {
          const messages = response.getMessages().getMessage() || [];
          resolve({
            success: false,
            errors: messages.map((msg: any) => msg.getText()),
          });
        }
      });
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
  }
}
