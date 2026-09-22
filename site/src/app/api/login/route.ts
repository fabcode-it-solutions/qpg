import { loginSchema, validateRequest } from "@/lib/utils/validation";
import { handleApiError, AppError } from "@/lib/utils/errors";
import { rateLimit } from "@/lib/utils/rate-limit";
import { AuthService } from "@/lib/services/auth.service";
import { AuthResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimitResult = rateLimit(req, 10, 15 * 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = validateRequest(loginSchema, body);

    const user = await AuthService.authenticateUser({ email, password });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name || "",
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login API error:', error);
    return handleApiError(error);
  }
}