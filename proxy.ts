import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isPosRoute = pathname.startsWith("/pos");

  if (!token && (isDashboardRoute || isPosRoute)) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
  }

  if (token && isAuthRoute) {
    if (token.role === "CASHIER") {
      return NextResponse.redirect(new URL("/pos", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/dashboard/settings")) {
    if (token?.role !== "OWNER" && token?.role !== "MANAGER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/pos/:path*", "/login", "/register"],
};