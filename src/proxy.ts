import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET })
  const { pathname } = req.nextUrl

  // Admin API routes — return JSON, not redirects
  if (pathname.startsWith("/api/admin")) {
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (token.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.next()
  }

  // Admin page routes (skip /admin/login itself)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url))
    if (token.role !== "admin") return NextResponse.redirect(new URL("/dashboard", req.url))
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
  ],
}
