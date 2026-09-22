import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { validationURL } = await req.json();

    // Call Apple's validation endpoint
    const response = await fetch(validationURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchantIdentifier: process.env.APPLE_PAY_MERCHANT_ID,
        displayName: "Your Course Platform",
        initiative: "web",
        initiativeContext: process.env.NEXT_PUBLIC_DOMAIN,
      }),
    });

    if (!response.ok) {
      throw new Error("Merchant validation failed");
    }

    const merchantSession = await response.json();
    return NextResponse.json(merchantSession);
  } catch (error) {
    console.error("Apple Pay merchant validation error:", error);
    return NextResponse.json(
      { error: "Merchant validation failed" },
      { status: 500 }
    );
  }
}
