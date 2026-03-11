'use client'

import type { RoomCategory, RoomFilters } from '@/lib/types'

interface RoomFilterProps {
  filters: RoomFilters
  onChange: (filters: RoomFilters) => void
}

const categories: Array<RoomCategory | 'all'> = ['all', 'study', 'coding', 'upsc', 'freelance', 'creative', 'general']

export function RoomFilter({ filters, onChange }: RoomFilterProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-[#334155] bg-[#1E293B] p-4 md:grid-cols-2">
      <input
        placeholder="Search rooms"
        value={filters.search}
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
        className="rounded-md border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]"
      />
      <select
        value={filters.category}
        onChange={(event) => onChange({ ...filters, category: event.target.value as RoomCategory | 'all' })}
        className="rounded-md border border-[#334155] bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]"
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category === 'all' ? 'All categories' : category}
          </option>
        ))}
      </select>
    </div>
  )
}
