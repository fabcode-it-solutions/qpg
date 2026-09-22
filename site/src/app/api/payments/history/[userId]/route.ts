import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { PaymentService } from "@/lib/services/payment.service";
import { PaymentHistoryResponse } from "@/types/profile";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<PaymentHistoryResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Users can only access their own payment history
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get payment history using service
    const payments = await PaymentService.getPaymentHistory(userId, 50);

    return NextResponse.json({
      success: true,
      payments: payments,
    });
  } catch (error) {
    console.error("Payment history fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}
