import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { dashboardService } from "@/lib/services/dashboard.service";
import { performanceMonitor } from "@/lib/utils/performance-monitor";

export async function GET(req: NextRequest) {
  return await performanceMonitor
    .trackApiCall(
      "dashboard",
      async () => {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dashboardData = await dashboardService.getDashboardData(
          session.user.id
        );
        return NextResponse.json(dashboardData);
      },
      { userId: req.nextUrl.searchParams.get("userId") || "unknown" }
    )
    .catch((error) => {
      console.log("dashboard data fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch dashboard data" },
        { status: 500 }
      );
    });
}
