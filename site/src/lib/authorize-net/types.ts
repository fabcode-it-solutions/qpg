export interface AuthorizeNetConfig {
  apiLoginId: string;
  transactionKey: string;
  environment: "sandbox" | "production";
}

export interface PaymentData {
  opaqueDataDescriptor: string;
  opaqueDataValue: string;
}

export interface BillingInfo {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  responseCode?: string;
  customerProfileId?: string;
  paymentProfileId?: string;
  responseMessage?: string;
  errors?: string[];
}

export interface SubscriptionData {
  name: string;
  amount: number;
  intervalLength: number;
  intervalUnit: "days" | "months";
  totalOccurrences: number;
  startDate: Date;
  paymentData: PaymentData;
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

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  customerProfileId?: string;
  paymentProfileId?: string;
  initialTransactionId?: string;
  cardLast4?: string;
  cardType?: string;
  responseMessage?: string;
  errors?: string[];
}

export interface GooglePayData {
  opaqueDataDescriptor: string;
  opaqueDataValue: string;
}

export interface GooglePayTransactionResult {
  success: boolean;
  customerProfileId?: string;
  paymentProfileId?: string;
  transactionId?: string;
  responseCode?: string;
  responseMessage?: string;
  errors?: string[];
}
