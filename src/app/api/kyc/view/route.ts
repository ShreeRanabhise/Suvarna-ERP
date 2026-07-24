import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { KYCService } from '@/services/kyc.service'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
    }

    // If it's already a full HTTP(S) URL or Data URI
    if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:') || filePath.startsWith('blob:')) {
      return NextResponse.redirect(filePath)
    }

    // Generate signed URL or local path from Supabase / filesystem
    const resolvedUrl = await KYCService.getSignedReadUrl(filePath, 3600)
    
    // Ensure absolute URL for NextResponse.redirect
    const targetUrl = resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://')
      ? resolvedUrl
      : new URL(resolvedUrl.startsWith('/') ? resolvedUrl : `/${resolvedUrl}`, req.url).toString()

    return NextResponse.redirect(targetUrl, {
      headers: {
        'Cache-Control': 'private, max-age=3600'
      }
    })
  } catch (error: unknown) {
    console.error('KYC image view error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve document image' },
      { status: 500 }
    )
  }
}
