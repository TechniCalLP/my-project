import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Path prefixes a TEACHER account is allowed into (own-department student list + scoring).
// Everything else under /admin and /api/admin is ADMIN/SUPER_ADMIN tier.
const TEACHER_ALLOWED_PREFIXES = ["/admin/my-students", "/admin/evaluation", "/admin/summary"]

// Path prefixes restricted to SUPER_ADMIN only (account & department management).
const SUPER_ADMIN_ONLY_PREFIXES = ["/admin/accounts", "/admin/departments", "/api/admin/accounts", "/api/admin/departments"]

function adminHomePath(adminRole: string | undefined) {
  return adminRole === "TEACHER" ? "/admin/evaluation" : "/admin/dashboard"
}

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET })
  const { pathname } = req.nextUrl
  const isApi = pathname.startsWith("/api/admin")
  const isAdminPage = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")

  // Admin API routes — return JSON, not redirects
  if (isApi) {
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (token.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (SUPER_ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) && token.adminRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (token.adminRole === "TEACHER" && !TEACHER_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p.replace("/admin", "/api/admin")))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.next()
  }

  // Admin page routes (skip /admin/login itself)
  if (isAdminPage) {
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url))
    if (token.role !== "admin") return NextResponse.redirect(new URL("/dashboard", req.url))
    if (SUPER_ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) && token.adminRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(adminHomePath(token.adminRole), req.url))
    }
    if (token.adminRole === "TEACHER" && !TEACHER_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL(adminHomePath(token.adminRole), req.url))
    }
    return NextResponse.next()
  }

  // Teacher-scoped API routes (score entry), outside /api/admin
  if (pathname.startsWith("/api/teacher")) {
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (token.role !== "admin" || token.adminRole !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.next()
  }

  // Student routes
  const studentRoutes = ["/dashboard", "/activities", "/history", "/join", "/certificate", "/settings"]
  if (studentRoutes.some((p) => pathname.startsWith(p))) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url))
    if (token.role !== "student") return NextResponse.redirect(new URL("/admin/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/activities/:path*",
    "/history/:path*",
    "/join/:path*",
    "/certificate/:path*",
    "/settings/:path*",
    "/api/admin/:path*",
    "/api/teacher/:path*",
  ],
}
