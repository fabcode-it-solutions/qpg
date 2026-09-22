import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  try {
    const headersList = await headers();
    
    // Try multiple methods to get the real IP
    const ip = headersList.get("x-forwarded-for")?.split(',')[0]?.trim() ||
              headersList.get("x-real-ip") ||
              headersList.get("cf-connecting-ip") ||
              headersList.get("x-client-ip") ||
              "unknown";

    return NextResponse.json({ 
      ip,
      headers: {
        'x-forwarded-for': headersList.get("x-forwarded-for"),
        'x-real-ip': headersList.get("x-real-ip"),
        'cf-connecting-ip': headersList.get("cf-connecting-ip"),
        'x-client-ip': headersList.get("x-client-ip"),
      }
    });

  } catch (error) {
    console.error("Get IP error:", error);
    return NextResponse.json({ ip: "unknown" });
  }
}