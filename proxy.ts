import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Routes a CASHIER is permitted to reach. Everything else under /dashboard
// is redirected back to the POS terminal. Extend this list if the counter
// staff need access to additional screens.
const CASHIER_ALLOWED_PREFIXES = [
  "/dashboard/pos",
  "/dashboard/admin/closings",
  "/dashboard/profile",
];

// Routes a MANAGER is not permitted to reach.
const MANAGER_BLOCKED_PREFIXES = [
  "/dashboard/admin/users",
  "/dashboard/admin/settings/users",
];

function matchesPrefix(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    // Cashier restrictions: POS, shift closings and own profile only.
    if (role === "CASHIER" && !matchesPrefix(path, CASHIER_ALLOWED_PREFIXES)) {
      return NextResponse.redirect(new URL("/dashboard/pos", req.url));
    }

    // Manager restrictions: blocked from user management.
    if (role === "MANAGER" && matchesPrefix(path, MANAGER_BLOCKED_PREFIXES)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
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
  // Guard the entire authenticated app surface (previously these paths did
  // not match the real /dashboard/* routes, leaving role rules unenforced).
  matcher: ["/dashboard/:path*"],
};
