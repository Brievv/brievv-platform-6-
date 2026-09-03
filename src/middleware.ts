import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Route-level gating. This is a UX convenience (redirect to /sign-in,
 * keep professionals out of /admin nav) — it is NOT the authorization
 * boundary. Every server action / API route must independently call
 * `assertCan()` (see src/lib/rbac.ts) because middleware can be bypassed
 * by calling the API directly.
 */
export default withAuth(
  function middleware(req) {
    const role = (req.nextauth.token as any)?.role as string | undefined;
    const path = req.nextUrl.pathname;

    const adminOnlyRoles = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "PROJECT_MANAGER", "FINANCE_ADMIN", "QUALITY_MANAGER", "SUPPORT_AGENT"];

    if (path.startsWith("/admin") && !adminOnlyRoles.includes(role ?? "")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/pro") && role !== "PROFESSIONAL" && !adminOnlyRoles.includes(role ?? "")) {
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
  matcher: ["/dashboard/:path*", "/admin/:path*", "/pro/:path*"],
};
