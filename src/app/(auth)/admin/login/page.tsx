import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import { Shield } from "lucide-react"
import { AdminLoginForm } from "@/components/forms/admin-login-form"

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role === "admin") redirect("/admin/dashboard")

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE — Admin Brand Gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 to-primary-500 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center border-4 border-white/20 shadow-2xl">
              <Image
                src="/logo-college.png"
                alt="วิทยาลัยเทคนิคลำปาง"
                width={120}
                height={120}
                className="object-contain rounded-full"
                priority
                unoptimized
              />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-center mb-3 font-thai">
            ระบบจัดการกิจกรรม
          </h1>
          <p className="text-lg text-white/80 text-center mb-8 font-thai">
            สำหรับเจ้าหน้าที่และผู้ดูแลระบบ
          </p>

          {/* Admin badge */}
          <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Admin Panel</span>
          </div>

          <div className="mt-12 text-center">
            <p className="text-white/80 text-sm font-thai">วิทยาลัยเทคนิคลำปาง</p>
            <p className="text-white/60 text-xs mt-1">Lampang Technical College</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile header (hidden on desktop) */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 font-thai">ระบบจัดการกิจกรรม</h2>
            <p className="text-gray-600 text-sm mt-1 font-thai">สำหรับเจ้าหน้าที่</p>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 font-thai">เข้าสู่ระบบ</h2>
              <p className="text-gray-600 font-thai text-sm">สำหรับเจ้าหน้าที่และผู้ดูแลระบบ</p>
            </div>

            <AdminLoginForm />

            <p className="text-center text-xs text-gray-400 font-thai mt-6">
              เข้าสู่ระบบในฐานะนักศึกษา?{" "}
              <a href="/login" className="text-primary-500 hover:underline">คลิกที่นี่</a>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500 font-thai">
            © 2567 วิทยาลัยเทคนิคลำปาง. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
