import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

const BUCKET_NAME = 'kyc-documents'

export class KYCService {
  /**
   * Generates a unique path and creates a signed upload URL for a client to upload a document directly to Supabase.
   * Note: The client must perform a PUT request to the returned signed URL.
   */
  static async generateUploadUrl(shopId: string, customerId: string, extension: string = 'pdf') {
    const supabase = await createClient()
    
    // Structure: shopId/customerId/uuid.pdf
    const filePath = `${shopId}/${customerId}/${uuidv4()}.${extension}`

    // Ensure we are authenticated (or we must rely on bucket policies, but server-side generated URLs are safer)
    // We generate a pre-signed upload URL
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(filePath)

    if (error || !data) {
      throw new Error(`Failed to generate upload URL: ${error?.message}`)
    }

    return {
      uploadUrl: data.signedUrl,
      filePath
    }
  }

  /**
   * Generates a signed URL to read a document. 
   * The URL is only valid for 60 seconds (or 3600 seconds) to ensure security.
   */
  static async getSignedReadUrl(filePath: string, expiresIn: number = 60) {
    const supabase = await createClient()
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn)

    if (error || !data) {
      throw new Error(`Failed to generate read URL: ${error?.message}`)
    }

    return data.signedUrl
  }

  /**
   * Deletes a KYC document from the bucket.
   */
  static async deleteDocument(filePath: string) {
    const supabase = await createClient()
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`)
    }
    return true
  }
}
