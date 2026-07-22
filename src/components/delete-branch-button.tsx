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
          const res = await deleteBranch(branchId)
          if (!res.success) {
            alert(res.error)
            return
          }
        } catch (err: unknown) {
          alert(err instanceof Error ? err.message : 'Failed to delete branch')
        }
      })
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-destructive hover:bg-destructive/5 hover:border-destructive/20 disabled:opacity-50 transition"
      title="Delete Branch"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
