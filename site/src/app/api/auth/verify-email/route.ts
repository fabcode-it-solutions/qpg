import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const isVerified = await AuthService.verifyEmail(token);

    if (isVerified) {
      return NextResponse.json({
        success: true,
        message: "Email verified successfully! You can now login to your account.",
      });
    } else {
      return NextResponse.json(
        { 
          error: "Invalid or expired verification token",
          message: "The verification link may have expired. Please request a new verification email."
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}