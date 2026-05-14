import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import { LoginForm } from "@/components/forms/login-form"

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role === "student") redirect("/dashboard")
  if (session?.user?.role === "admin") redirect("/admin/dashboard")

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE — Brand Gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-secondary-500 relative overflow-hidden">
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

          <h1 className="text-4xl font-bold text-center mb-4 font-thai">
            วิทยาลัยเทคนิคลำปาง
          </h1>
          <p className="text-xl text-white/90 text-center mb-8">
            Lampang Technical College
          </p>

          <div className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-full border border-white/20">
            <p className="text-lg font-medium font-thai">ระบบบันทึกกิจกรรมนักศึกษา</p>
          </div>

          <div className="mt-12 text-center">
            <p className="text-white/80 text-sm">Student Activity Management System</p>
            <p className="text-white/60 text-xs mt-2">Academic Year 2567</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo (hidden on desktop) */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Image
                src="/logo-college.png"
                alt="วิทยาลัยเทคนิคลำปาง"
                width={64}
                height={64}
                className="object-contain rounded-full"
                priority
                unoptimized
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900 font-thai">วิทยาลัยเทคนิคลำปาง</h2>
            <p className="text-gray-600 text-sm mt-1 font-thai">ระบบบันทึกกิจกรรมนักศึกษา</p>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 font-thai">เข้าสู่ระบบ</h2>
              <p className="text-gray-600 font-thai text-sm">กรุณากรอกข้อมูลเพื่อเข้าใช้งาน</p>
            </div>

            <LoginForm />

            <div className="mt-6 space-y-3 text-center">
              <p className="text-sm text-gray-600 font-thai">
                ลืมรหัสผ่าน?{" "}
                <span className="text-primary-500 font-semibold cursor-default">ติดต่อครูที่ปรึกษา</span>
              </p>
              <p className="text-xs text-gray-400 font-thai">
                สำหรับผู้ดูแลระบบ{" "}
                <a href="/admin/login" className="text-primary-500 hover:underline">เข้าสู่ระบบที่นี่</a>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500 font-thai">
            © 2567 วิทยาลัยเทคนิคลำปาง. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
