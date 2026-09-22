import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Send verification email for the current user
    await AuthService.sendVerificationEmail(session.user.email);

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully.",
    });
  } catch (error: any) {
    console.error("Send verification email error:", error);

    // Handle specific AppErrors
    if (error?.statusCode === 400 && error?.message?.includes("already verified")) {
      return NextResponse.json(
        { error: "Your email is already verified" },
        { status: 400 }
      );
    }

    if (error?.statusCode === 404) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}