import { NextResponse } from "next/server";
import { db } from "@/db";
import { protocols } from "@/db/schema/protocols";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allProtocols = await db
      .select({
        id: protocols.id,
        category: protocols.category,
        title: protocols.title,
        content: protocols.content,
        tags: protocols.tags,
        priority: protocols.priority,
      })
      .from(protocols)
      .orderBy(desc(protocols.priority), protocols.category, protocols.title);

    return NextResponse.json({
      success: true,
      data: allProtocols,
    });
  } catch (error) {
    console.error("Error fetching protocols:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch protocols",
      },
      { status: 500 }
    );
  }
}