export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface PurchaseConfirmationData {
  email: string;
  customerName: string;
  courseId: string;
  subscriptionId: string;
  amount: number;
  transactionId: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  businessAddress?: string;
  subject: string;
  message: string;
}

export interface EmailServiceConfig {
  service: string;
  port: number;
  secure: boolean;
  from: string;
  auth: {
    user: string;
    pass: string;
  };
}