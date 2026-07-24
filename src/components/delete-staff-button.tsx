'use client'

import { deleteStaffMember } from '@/app/actions'
import { Trash2 } from 'lucide-react'
import { LoadingButton } from '@/components/loading-button'

export default function DeleteStaffButton({ staffId, staffName }: { staffId: string, staffName: string }) {

  async function handleDelete() {
    if (confirm(`Are you sure you want to remove ${staffName} as a staff member?`)) {
      try {
        const res = await deleteStaffMember(staffId)
        if (!res.success) {
          alert(res.error)
          return
        }
      } catch (error: unknown) {
        alert(error instanceof Error ? error.message : 'Something went wrong')
      }
    }
  }

  return (
    <LoadingButton
      onClick={handleDelete}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      title="Remove Staff Member"
      aria-label={`Remove staff member ${staffName}`}
    >
      <Trash2 className="h-4 w-4" />
    </LoadingButton>
  )
}
