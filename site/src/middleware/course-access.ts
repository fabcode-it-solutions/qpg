import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkCourseAccess } from "@/lib/access-control/course-access";

export async function courseAccessMiddleware(
  req: NextRequest,
  courseId: string
) {
  try {
    const token = await getToken({ req });
    
    if (!token?.sub) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    const accessResult = await checkCourseAccess(token.sub, courseId);

    // Block access if no valid subscription
    if (!accessResult.hasAccess) {
      const redirectUrl = new URL('/courses/subscribe', req.url);
      redirectUrl.searchParams.set('courseId', courseId);
      redirectUrl.searchParams.set('reason', accessResult.message);
      
      if (accessResult.canReactivate && accessResult.subscriptionId) {
        redirectUrl.searchParams.set('reactivate', accessResult.subscriptionId);
      }
      
      return NextResponse.redirect(redirectUrl);
    }

    // Add access info to headers for the page
    const response = NextResponse.next();
    response.headers.set('x-course-access', JSON.stringify(accessResult));
    
    return response;
  } catch (error) {
    console.error('Course access middleware error:', error);
    return NextResponse.redirect(new URL('/error', req.url));
  }
}