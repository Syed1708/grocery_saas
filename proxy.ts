// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    // Cashier restrictions: Restricted to POS and Shift Closings
    if (role === "CASHIER") {
      const allowedPaths = ["/pos", "/closings", "/login"];
      const isAllowed = allowedPaths.some((p) => path.startsWith(p));
      if (!isAllowed) {
        return NextResponse.redirect(new URL("/pos", req.url));
      }
    }

    // Manager restrictions: Blocked from Store Settings & User Management
    if (role === "MANAGER") {
      if (path.startsWith("/settings/users")) {
        return NextResponse.redirect(new URL("/pos", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  }
);

export const config = {
  matcher: [
    "/pos/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/catalog/:path*",
    "/purchases/:path*",
    "/banking/:path*",
  ],
};