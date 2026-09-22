import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { z } from "zod";

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = resendVerificationSchema.parse(body);

    // Use AuthService method for consistency
    await AuthService.sendVerificationEmail(email);

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists and is not verified, a verification email has been sent.",
    });
  } catch (error: any) {
    console.error("Resend verification error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    // Handle specific AppErrors but don't reveal sensitive information
    if (error?.statusCode === 400 && error?.message?.includes("already verified")) {
      return NextResponse.json({
        success: true,
        message: "Email is already verified.",
      });
    }

    // Generic response for security
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists and is not verified, a verification email has been sent.",
    });
  }
}