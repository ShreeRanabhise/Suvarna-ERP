'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <button 
      disabled={pending}
      className="bg-primary text-primary-foreground hover:bg-primary-hover py-2 rounded-md font-medium text-sm transition-colors shadow-subtle mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed w-full"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
