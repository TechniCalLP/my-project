import type { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function checkStudentStatus(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { studentId },
    select: { id: true, isActive: true, isFirstLogin: true },
  })

  if (!student) throw new Error("Student not found")
  if (!student.isActive) throw new Error("Your account is disabled")

  return { id: student.id, isActive: student.isActive, isFirstLogin: student.isFirstLogin }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      id: "student-login",
      name: "Student",
      credentials: {
        studentId: { label: "รหัสนักศึกษา", type: "text" },
        password: { label: "รหัสผ่าน", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.studentId || !credentials?.password) return null

        const student = await prisma.student.findUnique({
          where: { studentId: credentials.studentId as string }
        })

        if (!student) return null

        if (!student.isActive) {
          throw new Error("ACCOUNT_DISABLED")
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          student.password
        )

        if (!isValid) return null

        return {
          id: student.id,
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          role: "student",
          isActive: student.isActive,
          isFirstLogin: student.isFirstLogin,
          year: student.year,
          department: student.department
        }
      }
    }),

    Credentials({
      id: "admin-login",
      name: "Admin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const admin = await prisma.admin.findUnique({
          where: { username: credentials.username as string }
        })

        if (!admin) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          admin.password
        )

        if (!isValid) return null

        return {
          id: admin.id,
          name: admin.name,
          role: "admin",
          adminRole: admin.role,
          departmentId: admin.departmentId
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as { role?: string }).role
        token.isActive = (user as { isActive?: boolean }).isActive
        token.isFirstLogin = (user as { isFirstLogin?: boolean }).isFirstLogin
        token.year = (user as { year?: string }).year
        token.department = (user as { department?: string }).department
        token.adminRole = (user as { adminRole?: string }).adminRole
        token.departmentId = (user as { departmentId?: string | null }).departmentId
      }
      if (trigger === "update" && session?.isFirstLogin !== undefined) {
        token.isFirstLogin = session.isFirstLogin
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        ;(session.user as { role?: string }).role = token.role as string
        ;(session.user as { isActive?: boolean }).isActive = token.isActive as boolean
        ;(session.user as { isFirstLogin?: boolean }).isFirstLogin = token.isFirstLogin as boolean
        ;(session.user as { year?: string }).year = token.year as string
        ;(session.user as { department?: string }).department = token.department as string
        ;(session.user as { adminRole?: string }).adminRole = token.adminRole as string | undefined
        ;(session.user as { departmentId?: string | null }).departmentId = token.departmentId as string | null | undefined
      }
      return session
    }
  }
}
