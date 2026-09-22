import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { paymentTransactions } from "@/db/schema/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user transactions
    const transactions = await db
      .select({
        id: paymentTransactions.id,
        transactionId: paymentTransactions.transactionId,
        type: paymentTransactions.type,
        status: paymentTransactions.status,
        amount: paymentTransactions.amount,
        currency: paymentTransactions.currency,
        description: paymentTransactions.description,
        processedAt: paymentTransactions.processedAt,
        responseMessage: paymentTransactions.responseMessage,
        createdAt: paymentTransactions.createdAt,
      })
      .from(paymentTransactions)
      .where(eq(paymentTransactions.userId, session.user.id))
      .orderBy(desc(paymentTransactions.processedAt))
      .limit(20); // Last 20 transactions

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}