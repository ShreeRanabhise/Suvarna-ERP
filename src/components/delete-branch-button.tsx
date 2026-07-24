'use client'

import { deleteBranch } from '@/app/actions'
import { Trash2 } from 'lucide-react'
import { LoadingButton } from '@/components/loading-button'

export default function DeleteBranchButton({ branchId, branchName }: { branchId: string, branchName: string }) {

  async function handleDelete() {
    if (confirm(`Are you sure you want to remove the branch "${branchName}"?`)) {
      try {
        const res = await deleteBranch(branchId)
        if (!res.success) {
          alert(res.error)
          return
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete branch')
      }
    }
  }

  return (
    <LoadingButton
      onClick={handleDelete}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-destructive/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      title="Delete Branch"
      aria-label={`Delete branch ${branchName}`}
    >
      <Trash2 className="h-4 w-4" />
    </LoadingButton>
  )
}
