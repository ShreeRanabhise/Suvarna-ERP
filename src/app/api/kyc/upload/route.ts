import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/app/actions'
import { KYCService } from '@/services/kyc.service'

/**
 * Endpoint for generating a signed upload URL for KYC documents.
 * The client requests this URL, then does a direct PUT to Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const { shopId, userId } = await getTenantContext()
    
    // In a real scenario, you might pass customerId in the body to organize folders
    const body = await req.json()
    const customerId = body.customerId || 'temp'
    const extension = body.extension || 'pdf'

    // Generate the signed URL
    const { uploadUrl, filePath } = await KYCService.generateUploadUrl(shopId, customerId, extension)

    return NextResponse.json({ uploadUrl, filePath })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload URL' },
      { status: 400 }
    )
  }
}
