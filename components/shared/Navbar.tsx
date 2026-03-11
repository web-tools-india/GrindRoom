import Link from 'next/link'

interface NavbarProps {
  username?: string | null
}

export function Navbar({ username }: NavbarProps) {
  return (
    <nav className="border-b border-[#334155] bg-[#1E293B]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-[#F8FAFC]">
          GrindRoom
        </Link>
        <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
          <Link href="/rooms" className="transition-colors hover:text-[#6366F1]">
            Rooms
          </Link>
          <Link href="/dashboard" className="transition-colors hover:text-[#6366F1]">
            Dashboard
          </Link>
          <Link href="/circles" className="transition-colors hover:text-[#6366F1]">
            Circles
          </Link>
          {username ? (
            <Link href={`/profile/${username}`} className="rounded-md border border-[#334155] px-3 py-1 text-[#F8FAFC]">
              @{username}
            </Link>
          ) : (
            <Link href="/" className="rounded-md border border-[#334155] px-3 py-1 text-[#F8FAFC]">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
