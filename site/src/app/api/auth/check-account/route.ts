import { NextRequest, NextResponse } from "next/server";
import { checkAccountConflict } from "@/lib/auth/account-linking";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const conflict = await checkAccountConflict(email);
    
    return NextResponse.json({
      conflict
    });
  } catch (error) {
    console.error('Check account error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}