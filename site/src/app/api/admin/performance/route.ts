import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { performanceMonitor } from "@/lib/utils/performance-monitor";

// Proper admin role checking function
async function checkAdminRole(userId: string): Promise<boolean> {
  // TODO: Implement proper role checking from database
  // This is a placeholder - replace with actual role checking logic
  try {
    // Example: Check user role from database
    // const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    // return user?.role === 'ADMIN';

    // For now, check against environment variable for admin user IDs
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(",") || [];
    return adminUserIds.includes(userId);
  } catch (error) {
    console.error(
      "Admin role check failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new Error("Admin role verification failed");
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has admin role (implement proper role checking)
    const isAdmin = await checkAdminRole(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const timeWindow = parseInt(searchParams.get("timeWindow") || "300000"); // Default 5 minutes
    const format = searchParams.get("format") || "summary";

    if (format === "raw") {
      const limit = parseInt(searchParams.get("limit") || "100");
      const rawMetrics = performanceMonitor.getRawMetrics(limit);

      return NextResponse.json({
        metrics: rawMetrics,
        total: rawMetrics.length,
      });
    }

    // Default: return performance summary
    const summary = performanceMonitor.getPerformanceSummary(timeWindow);

    return NextResponse.json({
      summary,
      timeWindow,
      timestamp: new Date().toISOString(),
      recommendations: generateRecommendations(summary),
    });
  } catch (error) {
    console.error('Performance metrics fetch failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: "Failed to fetch performance metrics" },
      { status: 500 }
    );
  }
}

interface PerformanceSummary {
  sanityApiCalls: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  databaseCalls: number;
}

function generateRecommendations(summary: PerformanceSummary): string[] {
  const recommendations: string[] = [];

  // Sanity API usage recommendations
  if (summary.sanityApiCalls > 100) {
    recommendations.push(
      "High Sanity API usage detected. Consider implementing longer cache durations."
    );
  }

  // Response time recommendations
  if (summary.averageResponseTime > 1000) {
    recommendations.push(
      "Average response time is high. Check database queries and Sanity calls."
    );
  }

  // Cache hit rate recommendations
  if (summary.cacheHitRate < 70) {
    recommendations.push(
      "Low cache hit rate. Consider optimizing cache keys and durations."
    );
  }

  // Error rate recommendations
  if (summary.errorRate > 5) {
    recommendations.push(
      "High error rate detected. Check API error logs for issues."
    );
  }

  // Database vs Sanity balance
  const totalApiCalls = summary.sanityApiCalls + summary.databaseCalls;
  if (totalApiCalls > 0 && summary.sanityApiCalls / totalApiCalls > 0.3) {
    recommendations.push(
      "Sanity API calls are high relative to database calls. Consider caching strategies."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Performance looks good! No immediate optimizations needed."
    );
  }

  return recommendations;
}
