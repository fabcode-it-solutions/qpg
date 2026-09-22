import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { ProfileService } from "@/lib/services/profile.service";
import {
  profileUpdateSchema,
  ProfileResponse,
  ApiResponse,
} from "@/types/profile";
import { z } from "zod";
import { sanitizeString, sanitizeLogOutput } from "@/lib/utils/security";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<ProfileResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    // Validate userId format
    if (
      !userId ||
      typeof userId !== "string" ||
      !/^[a-zA-Z0-9_-]+$/.test(userId)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Users can only access their own profile
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get user profile data using service
    const profile = await ProfileService.getUserProfile(userId);

    // Sanitize profile data before returning
    const sanitizedProfile = profile
      ? {
          ...profile,
          name: sanitizeString(profile.displayName || ""),
          email: sanitizeString(profile.email || ""),
          bio: sanitizeString(profile.bio || ""),
        }
      : null;

    return NextResponse.json({
      success: true,
      profile: sanitizedProfile,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    // Validate userId format
    if (
      !userId ||
      typeof userId !== "string" ||
      !/^[a-zA-Z0-9_-]+$/.test(userId)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Users can only update their own profile
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = profileUpdateSchema.parse(body);

    // Update profile using service
    await ProfileService.updateUserProfile(userId, validatedData);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error(
      "Profile update error:",
      sanitizeLogOutput(
        error instanceof Error ? error.message : "Unknown error"
      )
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid data provided",
          details: sanitizeString(error.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
