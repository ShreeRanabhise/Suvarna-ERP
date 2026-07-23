import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

const getAdminClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

const BUCKET_NAME = 'kyc-documents'

export class KYCService {
  private static async ensureBucketExists(supabase: NonNullable<ReturnType<typeof getAdminClient>>) {
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const exists = buckets?.some(b => b.name === BUCKET_NAME)
      if (!exists) {
        await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        })
      }
    } catch {
      // Ignore bucket creation errors if already exists
    }
  }

  /**
   * Rebuilt Document Storage Logic:
   * Writes uploaded document files to local public storage (/uploads/kyc/{shopId}/)
   * and syncs with Supabase Storage if configured.
   * Returns a clean, direct public web URL.
   */
  static async uploadFileDirect(shopId: string, branchId: string, customerId: string, file: File) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const fileName = `kyc_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // 1. Save locally to public/uploads/kyc/{shopId}/{branchId}/
    const relativeDirPath = `/uploads/kyc/${shopId}/${branchId}`
    const absoluteDirPath = path.join(process.cwd(), 'public', 'uploads', 'kyc', shopId, branchId)
    await fs.mkdir(absoluteDirPath, { recursive: true })

    const absoluteFilePath = path.join(absoluteDirPath, fileName)
    await fs.writeFile(absoluteFilePath, buffer)

    const publicUrl = `${relativeDirPath}/${fileName}`

    // 2. Optionally sync with Supabase Storage
    const supabase = getAdminClient()
    if (supabase) {
      try {
        await this.ensureBucketExists(supabase)
        const storagePath = `${shopId}/${branchId}/${fileName}`
        await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true
          })
      } catch {
        // Local file is preserved even if Supabase sync fails
      }
    }

    return publicUrl
  }

  /**
   * Generates a signed or direct URL to read a document.
   */
  static async getSignedReadUrl(filePath: string, expiresIn: number = 3600) {
    if (!filePath) return ''

    // If it's already a public web path or full HTTP URL, return as-is
    if (filePath.startsWith('/') || filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
      return filePath
    }

    const supabase = getAdminClient()
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(filePath, expiresIn)

        if (!error && data?.signedUrl) {
          return data.signedUrl
        }
      } catch {
        // Fallback to local upload path
      }
    }

    return `/uploads/kyc/${filePath}`
  }

  /**
   * Deletes a KYC document from local disk and Supabase bucket.
   */
  static async deleteDocument(filePath: string) {
    if (!filePath) return true

    // Remove local file if path is relative
    if (filePath.startsWith('/uploads/kyc/')) {
      try {
        const absolutePath = path.join(process.cwd(), 'public', filePath)
        await fs.unlink(absolutePath)
      } catch {
        // File may already be deleted
      }
    }

    const supabase = getAdminClient()
    if (supabase) {
      try {
        const key = filePath.replace(/^\/uploads\/kyc\//, '')
        await supabase.storage.from(BUCKET_NAME).remove([key])
      } catch {
        // Ignore error on deletion
      }
    }
    return true
  }
}
