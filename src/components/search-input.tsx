'use client'

import { Search, X } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useRef } from 'react'

export default function SearchInput({ placeholder = 'Search by name, phone, loan #, Aadhaar, PAN...' }: { placeholder?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const queryValue = searchParams.get('query')?.toString() || ''

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

  function handleClear() {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    handleSearch('')
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
        <Search className="h-4 w-4" />
      </div>
      <input
        ref={inputRef}
        type="search"
        aria-label="Search items"
        placeholder={placeholder}
        defaultValue={queryValue}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full rounded-md border border-border bg-background pl-9 pr-14 py-2 text-sm text-foreground placeholder:text-foreground-disabled transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {isPending ? (
          <span className="text-[10px] font-semibold text-primary animate-pulse">
            Searching...
          </span>
        ) : queryValue ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="p-0.5 rounded text-foreground-muted hover:text-foreground hover:bg-background-secondary transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
