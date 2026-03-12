import Link from 'next/link'

interface NavbarProps {
  username?: string | null
}

export function Navbar({ username }: NavbarProps) {
  return (
    <nav className="border-b border-white/10 bg-[#0E1117]/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-[#EEE8D5]">
          GrindRoom
        </Link>
        <div className="flex items-center gap-4 text-sm text-[#7A8BA8]">
          <Link href="/rooms" className="transition-colors hover:text-[#E8A847]">
            Rooms
          </Link>
          <Link href="/dashboard" className="transition-colors hover:text-[#E8A847]">
            Dashboard
          </Link>
          <Link href="/circles" className="transition-colors hover:text-[#E8A847]">
            Circles
          </Link>
          {username ? (
            <Link
              href={`/profile/${username}`}
              className="rounded-md border border-white/10 px-3 py-1 text-[#EEE8D5] transition-colors hover:border-white/[0.22]"
            >
              @{username}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-[#E8A847] px-3 py-1 text-sm font-semibold text-[#08090E] transition-colors hover:bg-[#F0B85A]"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
