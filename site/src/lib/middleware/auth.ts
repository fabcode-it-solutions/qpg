import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  const token = await getToken({ req });

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  return handler(req);
}

export async function getAuthenticatedUser(req: NextRequest) {
  const token = await getToken({ req });
  return token?.sub ? { id: token.sub, email: token.email } : null;
}