import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { AppError } from "@/lib/utils/errors";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.email("Invalid email format"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Validate email format more strictly
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Get client IP and user agent for security tracking
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    // Log the attempt for security monitoring (mask email for privacy)
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
    console.log(
      `Password reset attempt from IP: ${ipAddress}, Email: ${maskedEmail}`
    );

    await AuthService.initiatePasswordReset({
      email: email.trim(),
      ipAddress,
      userAgent,
    });

    // Return success when email is sent
    return NextResponse.json({
      success: true,
      message: "Password reset link has been sent to your email address.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (error instanceof AppError) {
      // Handle rate limiting specifically
      if (error.statusCode === 429) {
        return NextResponse.json(
          {
            error:
              "Too many password reset attempts. Please wait 15 minutes before trying again.",
            retryAfter: 900, // 15 minutes in seconds
          },
          {
            status: 429,
            headers: {
              "Retry-After": "900",
            },
          }
        );
      }

      // Handle user not found
      if (error.statusCode === 404) {
        return NextResponse.json(
          {
            error:
              "No account found with this email address. Please check your email or create a new account.",
          },
          { status: 404 }
        );
      }

      // Handle inactive account
      if (error.statusCode === 403) {
        return NextResponse.json(
          {
            error:
              "Account is deactivated. Please contact support for assistance.",
          },
          { status: 403 }
        );
      }

      // Handle social login accounts
      if (error.statusCode === 400) {
        return NextResponse.json(
          {
            error:
              "This account uses social login. Please sign in with Google or your social provider.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
