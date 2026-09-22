import {
  AuthorizeNetConfig,
  PaymentData,
  BillingInfo,
  TransactionResult,
} from "./types";

const ApiContracts = require("authorizenet").APIContracts;
const ApiControllers = require("authorizenet").APIControllers;
const Constants = require("authorizenet").Constants;
export class AuthorizeNetTransactionService {
  private config: AuthorizeNetConfig;

  constructor(config: AuthorizeNetConfig) {
    this.config = config;
  }

  async createTransaction(
    paymentData: PaymentData,
    amount: number,
    billingInfo: BillingInfo
  ): Promise<TransactionResult> {
    return new Promise((resolve) => {
      try {
        // Merchant authentication
        const merchantAuth = new ApiContracts.MerchantAuthenticationType();
        merchantAuth.setName(this.config.apiLoginId);
        merchantAuth.setTransactionKey(this.config.transactionKey);

        // Payment using opaque data
        const opaqueData = new ApiContracts.OpaqueDataType();
        opaqueData.setDataDescriptor(paymentData.opaqueDataDescriptor);
        opaqueData.setDataValue(paymentData.opaqueDataValue);

        const paymentType = new ApiContracts.PaymentType();
        paymentType.setOpaqueData(opaqueData);

        // Billing information
        const billTo = new ApiContracts.CustomerAddressType();
        billTo.setFirstName(billingInfo.firstName);
        billTo.setLastName(billingInfo.lastName);
        billTo.setAddress(billingInfo.address);
        billTo.setCity(billingInfo.city);
        billTo.setState(billingInfo.state);
        billTo.setZip(billingInfo.zip);
        billTo.setCountry(billingInfo.country || "US");

        // Transaction request
        const transactionRequest = new ApiContracts.TransactionRequestType();
        transactionRequest.setTransactionType(
          ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
        );
        transactionRequest.setPayment(paymentType);
        transactionRequest.setAmount((amount / 100).toFixed(2)); // Convert cents to dollars
        transactionRequest.setBillTo(billTo);

        // Create transaction request
        const createRequest = new ApiContracts.CreateTransactionRequest();
        createRequest.setMerchantAuthentication(merchantAuth);
        createRequest.setTransactionRequest(transactionRequest);

        // Execute transaction
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
            const transactionResponse = response.getTransactionResponse();

            if (
              transactionResponse &&
              transactionResponse.getResponseCode() === "1"
            ) {
              resolve({
                success: true,
                transactionId: transactionResponse.getTransId(),
                responseCode: transactionResponse.getResponseCode(),
                responseMessage:
                  transactionResponse
                    .getMessages()
                    ?.getMessage()?.[0]
                    ?.getDescription() || "Transaction approved",
              });
            } else {
              const errors = transactionResponse?.getErrors()?.getError() || [];

              resolve({
                success: false,
                errors: errors.map((error: any) => error.getErrorText()),
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

  async captureTransaction(transactionId: string): Promise<TransactionResult> {
    return new Promise((resolve) => {
      try {
        // Merchant authentication
        const merchantAuth = new ApiContracts.MerchantAuthenticationType();
        merchantAuth.setName(this.config.apiLoginId);
        merchantAuth.setTransactionKey(this.config.transactionKey);

        // Transaction request for capture
        const transactionRequest = new ApiContracts.TransactionRequestType();
        transactionRequest.setTransactionType(
          ApiContracts.TransactionTypeEnum.PRIORAUTHCAPTURETRANSACTION
        );
        transactionRequest.setRefTransId(transactionId);

        // Create transaction request
        const createRequest = new ApiContracts.CreateTransactionRequest();
        createRequest.setMerchantAuthentication(merchantAuth);
        createRequest.setTransactionRequest(transactionRequest);

        // Execute capture
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
            const transactionResponse = response.getTransactionResponse();

            if (
              transactionResponse &&
              transactionResponse.getResponseCode() === "1"
            ) {
              resolve({
                success: true,
                transactionId: transactionResponse.getTransId(),
                responseCode: transactionResponse.getResponseCode(),
                responseMessage:
                  transactionResponse
                    .getMessages()
                    ?.getMessage()?.[0]
                    ?.getDescription() || "Transaction captured",
              });
            } else {
              const errors = transactionResponse?.getErrors()?.getError() || [];
              resolve({
                success: false,
                errors: errors.map((error: any) => error.getErrorText()),
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
}
