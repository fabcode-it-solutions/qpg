import { db } from "@/db";
import { paymentTransactions } from "@/db/schema/auth";
import { courses } from "@/db/schema/courses";
import { eq, desc } from "drizzle-orm";
import { PaymentHistoryItem } from "@/types/profile";

export class PaymentService {
  /**
   * Get payment history for user
   */
  static async getPaymentHistory(
    userId: string,
    limit: number = 50
  ): Promise<PaymentHistoryItem[]> {
    try {
      const payments = await db
        .select({
          id: paymentTransactions.id,
          transactionId: paymentTransactions.transactionId,
          type: paymentTransactions.type,
          status: paymentTransactions.status,
          amount: paymentTransactions.amount,
          currency: paymentTransactions.currency,
          description: paymentTransactions.description,
          processedAt: paymentTransactions.processedAt,
        })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.userId, userId))
        .orderBy(desc(paymentTransactions.createdAt))
        .limit(limit);

      return payments.map((payment) => ({
        id: payment.id,
        courseId: null,
        courseName: "Subscription Payment",
        amount: payment.amount || "0",
        type: payment.type || "unknown",
        status: payment.status || "unknown",
        description: payment.description || "",
        paidAt: payment.processedAt?.toISOString() || new Date().toISOString(),
        receiptUrl: null,
        transactionId: payment.transactionId,
        currency: payment.currency || "USD",
      }));
    } catch (error) {
      console.error("Payment history fetch error:", error);
      throw new Error("Failed to fetch payment history");
    }
  }

  /**
   * Get single payment by ID
   */
  static async getPayment(
    paymentId: string,
    userId: string
  ): Promise<PaymentHistoryItem | null> {
    try {
      const payment = await db
        .select({
          id: paymentTransactions.id,
          transactionId: paymentTransactions.transactionId,
          type: paymentTransactions.type,
          status: paymentTransactions.status,
          amount: paymentTransactions.amount,
          currency: paymentTransactions.currency,
          description: paymentTransactions.description,
          processedAt: paymentTransactions.processedAt,
        })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.id, paymentId))
        .limit(1);

      if (payment.length === 0) {
        return null;
      }

      const p = payment[0];
      return {
        id: p.id,
        courseId: null,
        courseName: "Subscription Payment",
        amount: p.amount || "0",
        type: p.type || "unknown",
        status: p.status || "unknown",
        description: p.description || "",
        paidAt: p.processedAt?.toISOString() || new Date().toISOString(),
        receiptUrl: null,
        transactionId: p.transactionId,
        currency: p.currency || "USD",
      };
    } catch (error) {
      console.error("Payment fetch error:", error);
      throw new Error("Failed to fetch payment");
    }
  }

  /**
   * Get payment statistics for user
   */
  static async getPaymentStats(userId: string): Promise<{
    totalSpent: number;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
  }> {
    try {
      const payments = await db
        .select({
          amount: paymentTransactions.amount,
          status: paymentTransactions.status,
        })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.userId, userId));

      const stats = payments.reduce(
        (acc, payment) => {
          const amount = parseFloat(payment.amount?.toString() || "0");

          acc.totalPayments++;

          if (payment.status === "completed") {
            acc.successfulPayments++;
            acc.totalSpent += amount;
          } else if (payment.status === "failed") {
            acc.failedPayments++;
          }

          return acc;
        },
        {
          totalSpent: 0,
          totalPayments: 0,
          successfulPayments: 0,
          failedPayments: 0,
        }
      );

      return stats;
    } catch (error) {
      console.error("Payment stats error:", error);
      return {
        totalSpent: 0,
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
      };
    }
  }

  /**
   * Get recent payments (last 30 days)
   */
  static async getRecentPayments(
    userId: string
  ): Promise<PaymentHistoryItem[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const payments = await db
        .select({
          id: paymentTransactions.id,
          transactionId: paymentTransactions.transactionId,
          type: paymentTransactions.type,
          status: paymentTransactions.status,
          amount: paymentTransactions.amount,
          currency: paymentTransactions.currency,
          description: paymentTransactions.description,
          processedAt: paymentTransactions.processedAt,
        })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.userId, userId))
        .orderBy(desc(paymentTransactions.createdAt))
        .limit(10);

      return payments
        .filter((payment) => {
          if (!payment.processedAt) return false;
          return new Date(payment.processedAt) >= thirtyDaysAgo;
        })
        .map((payment) => ({
          id: payment.id,
          courseId: null,
          courseName: "Subscription Payment",
          amount: payment.amount || "0",
          type: payment.type || "unknown",
          status: payment.status || "unknown",
          description: payment.description || "",
          paidAt: payment.processedAt?.toISOString() || new Date().toISOString(),
          receiptUrl: null,
          transactionId: payment.transactionId,
          currency: payment.currency || "USD",
        }));
    } catch (error) {
      console.error("Recent payments fetch error:", error);
      return [];
    }
  }

  /**
   * Get payments by status
   */
  static async getPaymentsByStatus(
    userId: string,
    status: string
  ): Promise<PaymentHistoryItem[]> {
    try {
      const payments = await db
        .select({
          id: paymentTransactions.id,
          transactionId: paymentTransactions.transactionId,
          type: paymentTransactions.type,
          status: paymentTransactions.status,
          amount: paymentTransactions.amount,
          currency: paymentTransactions.currency,
          description: paymentTransactions.description,
          processedAt: paymentTransactions.processedAt,
        })
        .from(paymentTransactions)
        .where(
          eq(
            paymentTransactions.status,
            status as
              | "pending"
              | "cancelled"
              | "completed"
              | "failed"
              | "refunded"
          )
        )
        .orderBy(desc(paymentTransactions.createdAt));

      return payments.map((payment) => ({
        id: payment.id,
        courseId: null,
        courseName: "Subscription Payment",
        amount: payment.amount || "0",
        type: payment.type || "unknown",
        status: payment.status || "unknown",
        description: payment.description || "",
        paidAt: payment.processedAt?.toISOString() || new Date().toISOString(),
        receiptUrl: null,
        transactionId: payment.transactionId,
        currency: payment.currency || "USD",
      }));
    } catch (error) {
      console.error("Payments by status fetch error:", error);
      return [];
    }
  }

  /**
   * Get payments for specific course
   */
  static async getPaymentsForCourse(
    userId: string,
    courseId: string
  ): Promise<PaymentHistoryItem[]> {
    try {
      // Note: paymentTransactions no longer has courseId - this method is deprecated
      return [];
    } catch (error) {
      console.error("Course payments fetch error:", error);
      return [];
    }
  }
}
