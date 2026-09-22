import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkCourseAccess } from "@/lib/access-control/course-access";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;
    const accessResult = await checkCourseAccess(session.user.id, courseId);

    return NextResponse.json(accessResult);
  } catch (error) {
    console.error("Course access check error:", error);
    return NextResponse.json(
      { error: "Failed to check course access" },
      { status: 500 }
    );
  }
}
