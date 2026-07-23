import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/app/actions'
import { KYCService } from '@/services/kyc.service'
import prisma from '@/lib/prisma'

/**
 * Endpoint for generating a signed upload URL for KYC documents.
 * The client requests this URL, then does a direct PUT to Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const { shopId, userId } = await getTenantContext()
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const customerId = (formData.get('customerId') as string) || 'temp'

    if (!file) {
      return NextResponse.json({ error: 'No file provided for upload' }, { status: 400 })
    }

    // Resolve branchId
    let branchId = formData.get('branchId') as string | null
    if (!branchId) {
      const creator = await prisma.user.findUnique({
        where: { id: userId },
        select: { branchId: true }
      })
      if (creator?.branchId) {
        branchId = creator.branchId
      } else {
        const defaultBranch = await prisma.branch.findFirst({
          where: { shopId },
          orderBy: { createdAt: 'asc' }
        })
        branchId = defaultBranch?.id || 'default'
      }
    }

    const filePath = await KYCService.uploadFileDirect(shopId, branchId, customerId, file)
    return NextResponse.json({ filePath })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload document' },
      { status: 400 }
    )
  }
}
