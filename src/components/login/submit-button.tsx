'use client'

import { LoadingButton } from '@/components/loading-button'

export function SubmitButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <LoadingButton 
      type="submit"
      className="bg-primary text-primary-foreground hover:bg-primary-hover py-2 rounded-md font-medium text-sm transition-colors shadow-subtle mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed w-full"
      {...props}
    >
      {children}
    </LoadingButton>
  )
}
