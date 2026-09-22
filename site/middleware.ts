import { NextResponse } from 'next/server';
import { withAuth } from "next-auth/middleware";
import { authOptions } from "@/lib/auth/config"; // removed for portfolio release — see README

// This function can be marked `async` if using `await` inside
export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Check if user is trying to access course content
    if (path.startsWith('/courses/') && path.split('/').length > 2) {
      // If no token, redirect to login
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
      
      // For course content, we'll check subscription status in the page component
      // This is just a basic auth check
      return NextResponse.next();
    }
    
    // Default behavior for protected routes
    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/auth/login",
    },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/account/:path*",
    "/courses/:path*",
    "/api/courses/:path*"
  ],
};
