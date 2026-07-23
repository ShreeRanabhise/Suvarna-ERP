"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function RouteLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Hide the loader whenever the URL changes (navigation completed)
    setLoading(false)
  }, [pathname, searchParams])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a, button[type='submit']")
      
      if (!target) return

      // For links
      if (target.tagName === "A") {
        const href = target.getAttribute("href")
        // Don't show loader for external links, anchor links, or open in new tab
        if (!href || href.startsWith("http") || href.startsWith("#") || target.getAttribute("target") === "_blank") {
          return
        }
        
        // Show loader if we're actually navigating to a new path
        const currentUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")
        if (href !== currentUrl) {
          setLoading(true)
        }
      }
      
      // For buttons (form submission), we can also show the global loader
      // unless the button explicitly handles its own loading state.
      if (target.tagName === "BUTTON") {
        // If it's a submit button inside a form, it will likely cause a mutation
        // but we might not want to block the whole UI if the button handles it inline.
        // For now, we'll just show the top progress bar.
        setLoading(true)
        // Auto-hide after 3 seconds in case it doesn't trigger a navigation
        setTimeout(() => setLoading(false), 3000)
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [pathname, searchParams])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[9999] bg-primary/20 pointer-events-none overflow-hidden">
      <div className="h-full bg-primary animate-progress-bar origin-left" />
    </div>
  )
}
