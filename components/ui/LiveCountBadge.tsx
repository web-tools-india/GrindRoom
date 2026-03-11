interface LiveCountBadgeProps {
  count: number
}

export function LiveCountBadge({ count }: LiveCountBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
      {count} live
    </span>
  )
}
