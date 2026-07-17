'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

export default function SearchInput({ placeholder = 'Search...' }: { placeholder?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="search"
        placeholder={placeholder}
        defaultValue={searchParams.get('query')?.toString() || ''}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full rounded-xl border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-white pl-9 pr-12 py-2 text-sm text-slate-800 outline-none transition"
      />
      {isPending && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-primary animate-pulse">
          Pending
        </span>
      )}
    </div>
  )
}
