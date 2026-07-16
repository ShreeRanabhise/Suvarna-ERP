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
      className="text-destructive hover:opacity-80 disabled:opacity-50 transition p-1"
      title="Remove Staff Member"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
