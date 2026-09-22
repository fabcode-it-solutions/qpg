import { registerSchema, validateRequest } from "@/lib/utils/validation";
import { handleApiError, AppError } from "@/lib/utils/errors";
import { rateLimit } from "@/lib/utils/rate-limit";
import { AuthService } from "@/lib/services/auth.service";
import { AuthResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { checkAccountConflict } from "@/lib/auth/account-linking";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimitResult = rateLimit(req, 5, 15 * 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, password } = validateRequest(registerSchema, body);

    // Check for account conflicts
    const conflict = await checkAccountConflict(email);
    if (conflict) {
      return NextResponse.json(
        { 
          error: "Account already exists",
          conflict 
        },
        { status: 409 }
      );
    }

    const newUser = await AuthService.registerUser({ name, email, password });

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name || "",
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Register API error:', error);
    return handleApiError(error);
  }
}
