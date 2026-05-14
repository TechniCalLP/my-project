import "next-auth"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      isFirstLogin: boolean
      year: string
      department: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    isFirstLogin?: boolean
    year?: string
    department?: string
  }
}
