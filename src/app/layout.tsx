import type { Metadata } from "next"
import { Noto_Sans_Thai, Inter } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ระบบจัดการกิจกรรมนักศึกษา",
  description: "Student Activity Management System",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-thai antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
