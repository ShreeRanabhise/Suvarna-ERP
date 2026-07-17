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
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <input
        type="search"
        placeholder={placeholder}
        defaultValue={searchParams.get('query')?.toString() || ''}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full rounded-md border bg-background pl-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
      />
      {isPending && (
        <span className="absolute right-2.5 top-3 text-xs text-muted-foreground animate-pulse">
          Searching...
        </span>
      )}
    </div>
  )
}
