const Sk = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 ${className ?? ""}`} />
)

export function AdminLoadingSkeleton() {
  return (
    <div className="lg:flex min-h-screen">
      {/* Desktop sidebar — mirrors AdminNav: bg-gray-900, w-64 */}
      <nav className="hidden lg:flex w-64 min-h-screen flex-shrink-0 bg-gray-900 flex-col">
        {/* Header: "ผู้ดูแลระบบ" + ชื่อ */}
        <div className="p-6 border-b border-gray-700 flex flex-col gap-2">
          <Sk className="h-3 w-20 bg-gray-700" />
          <Sk className="h-4 w-32 bg-gray-700" />
        </div>
        {/* Nav items: 3 items */}
        <div className="flex-1 py-4 flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-3">
              <Sk className="h-[18px] w-[18px] bg-gray-700 rounded" />
              <Sk className="h-3 w-20 bg-gray-700" />
            </div>
          ))}
        </div>
        {/* Footer: ออกจากระบบ */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 px-2 py-2">
            <Sk className="h-[18px] w-[18px] bg-gray-700 rounded" />
            <Sk className="h-3 w-24 bg-gray-700" />
          </div>
        </div>
      </nav>

      {/* Mobile top header — bg-gray-900, h-14 */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-gray-900 flex items-center gap-3 px-4">
        <Sk className="h-8 w-8 bg-gray-700 rounded" />
        <Sk className="h-4 w-36 bg-gray-700" />
      </header>

      {/* Main content area */}
      <main className="flex-1 bg-gray-50 overflow-auto pt-14 lg:pt-0">
        {/* Top progress bar */}
        <div className="h-0.5 w-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-gray-300 rounded-full animate-[loading-bar_1.8s_ease-in-out_infinite]" />
        </div>
        {/* Content placeholder */}
        <div className="p-4 md:p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Sk className="h-7 w-40" />
            <Sk className="h-3 w-56" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-2">
                <Sk className="h-8 w-12" />
                <Sk className="h-3 w-20" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-0 overflow-hidden">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
                <Sk className="h-3 w-24" style={{ animationDelay: `${i * 50}ms` }} />
                <Sk className="h-3 flex-1" style={{ animationDelay: `${i * 50 + 20}ms` }} />
                <Sk className="h-3 w-16 hidden md:block" style={{ animationDelay: `${i * 50 + 40}ms` }} />
                <Sk className="h-5 w-12 rounded-full" style={{ animationDelay: `${i * 50 + 60}ms` }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export function StudentLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header — bg-white, h-14, logo + avatar */}
      <header className="md:hidden bg-white border-b sticky top-0 z-40">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Sk className="h-8 w-8 rounded-lg" />
            <Sk className="h-4 w-32" />
          </div>
          <Sk className="h-8 w-8 rounded-full" />
        </div>
      </header>

      {/* Desktop top nav — bg-white, h-16, logo + 4 nav items + avatar */}
      <nav className="hidden md:block bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Sk className="h-10 w-10 rounded-lg" />
                <Sk className="h-4 w-36 hidden lg:block" />
              </div>
              <div className="flex gap-1">
                {[72, 64, 56, 56].map((w, i) => (
                  <Sk key={i} className="h-9 rounded-lg" style={{ width: `${w}px`, animationDelay: `${i * 50}ms` }} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sk className="h-7 w-7 rounded-full" />
              <Sk className="h-4 w-28 hidden lg:block" />
              <Sk className="h-4 w-4" />
            </div>
          </div>
        </div>
      </nav>

      {/* Top progress bar */}
      <div className="h-0.5 w-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-gray-300 rounded-full animate-[loading-bar_1.8s_ease-in-out_infinite]" />
      </div>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Sk className="h-7 w-32" />
          <Sk className="h-3 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-2">
              <Sk className="h-8 w-12" style={{ animationDelay: `${i * 60}ms` }} />
              <Sk className="h-3 w-20" style={{ animationDelay: `${i * 60 + 30}ms` }} />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-4 border-b border-gray-50 last:border-0">
              <Sk className="h-10 w-10 rounded-lg flex-shrink-0" style={{ animationDelay: `${i * 50}ms` }} />
              <div className="flex flex-col gap-1.5 flex-1">
                <Sk className="h-3.5" style={{ width: `${[70, 85, 60, 75, 65][i]}%`, animationDelay: `${i * 50 + 20}ms` }} />
                <Sk className="h-3 w-24" style={{ animationDelay: `${i * 50 + 40}ms` }} />
              </div>
              <Sk className="h-6 w-16 rounded-full hidden sm:block" style={{ animationDelay: `${i * 50 + 60}ms` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav — 4 items, fixed */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="grid grid-cols-4 h-16">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center justify-center gap-1.5">
              <Sk className="h-5 w-5" style={{ animationDelay: `${i * 50}ms` }} />
              <Sk className="h-2.5 w-8" style={{ animationDelay: `${i * 50 + 20}ms` }} />
            </div>
          ))}
        </div>
      </nav>
    </div>
  )
}
