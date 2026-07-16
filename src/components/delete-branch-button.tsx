'use client'

import { useTransition } from 'react'
import { deleteBranch } from '@/app/actions'
import { Trash2 } from 'lucide-react'

export default function DeleteBranchButton({ branchId, branchName }: { branchId: string, branchName: string }) {
  const [isPending, startTransition] = useTransition()

  async function handleDelete() {
    if (confirm(`Are you sure you want to remove the branch "${branchName}"?`)) {
      startTransition(async () => {
        try {
          await deleteBranch(branchId)
        } catch (err: any) {
          alert(err.message || 'Failed to delete branch')
        }
      })
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-destructive hover:opacity-80 disabled:opacity-50 transition p-1"
      title="Delete Branch"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
