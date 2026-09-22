import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/services/email.service";

export async function POST(req: NextRequest) {
  try {
    const { email, customerName, courseId, subscriptionId, amount, transactionId } = await req.json();

    const success = await EmailService.sendPurchaseConfirmationEmail({
      email,
      customerName,
      courseId,
      subscriptionId,
      amount,
      transactionId,
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email sending failed:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}