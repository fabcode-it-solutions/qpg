export interface Subscription {
  id: string;
  authorizeNetSubscriptionId: string;
  name: string;
  description: string;
  status: string;
  amount: string;
  currency: string;
  intervalLength: number;
  intervalUnit: string;
  startDate: string;
  nextPaymentDate: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  courseTitle: string;
  courseSlug: string;
}

export interface MessageState {
  type: "success" | "error";
  text: string;
}

export interface StatusConfig {
  [key: string]: {
    color: string;
    bg: string;
    label: string;
  };
}