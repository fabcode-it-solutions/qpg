import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  revalidateTag("sanity");
  console.log("Sanity Webhook triggered");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
export async function GET(req: NextRequest) {
  revalidateTag("sanity");
  console.log("Sanity Webhook triggered GET");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
