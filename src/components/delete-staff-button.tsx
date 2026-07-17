'use client'

import { useTransition } from 'react'
import { deleteStaffMember } from '@/app/actions'
import { Trash2 } from 'lucide-react'

export default function DeleteStaffButton({ staffId, staffName }: { staffId: string, staffName: string }) {
  const [isPending, startTransition] = useTransition()

  async function handleDelete() {
    if (confirm(`Are you sure you want to remove ${staffName} as a staff member?`)) {
      startTransition(async () => {
        try {
          await deleteStaffMember(staffId)
        } catch (err: any) {
          alert(err.message || 'Failed to delete staff member')
        }
      })
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-destructive hover:bg-destructive/5 hover:border-destructive/20 disabled:opacity-50 transition"
      title="Remove Staff Member"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
