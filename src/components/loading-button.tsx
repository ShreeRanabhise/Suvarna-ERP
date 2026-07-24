"use client"

import React, { useTransition } from "react"
import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  loaderClass?: string
  loading?: boolean
}

export function LoadingButton({ 
  children, 
  onClick, 
  disabled, 
  className, 
  loaderClass = "h-4 w-4 animate-spin",
  loading: externalLoading,
  ...props 
}: LoadingButtonProps) {
  const { pending: formPending } = useFormStatus()
  const [isPending, startTransition] = useTransition()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      // In React 19 (Next 15), startTransition supports async functions.
      // This ensures both the Promise AND any resulting router.push() state updates
      // are tracked under a single isPending state.
      startTransition(async () => {
        await onClick(e)
      })
    }
  }

  const loading = externalLoading !== undefined ? externalLoading : (formPending || isPending)

  return (
    <button
      onClick={onClick ? handleClick : undefined}
      disabled={disabled || loading}
      className={className}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className={loaderClass} />
          {/* We wrap children so text doesn't collapse weirdly if it's flex */}
          <span className="opacity-80 flex items-center justify-center gap-2">
            {children}
          </span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
