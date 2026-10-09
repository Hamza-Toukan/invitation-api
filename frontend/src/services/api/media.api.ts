import { apiClient } from './client';

export type MediaUploadPurpose = 'EVENT_GALLERY' | 'EVENT_MUSIC' | 'PAYMENT_RECEIPT';

export interface PresignedUrlRequest {
  filename: string;
  mimeType: string;
  fileSize: number;
  purpose: MediaUploadPurpose;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key?: string;
  expiresInSeconds?: number;
  message?: string;
  /** Backwards compatibility alias for publicUrl */
  fileUrl?: string;
}

export const mediaApi = {
  /**
   * Request a Cloudflare R2 presigned PUT upload URL from the backend
   */
  async getPresignedUrl(dto: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    const res = await apiClient.post<PresignedUrlResponse>('/media/presigned-url', {
      filename: dto.filename,
      mimeType: dto.mimeType,
      fileSize: dto.fileSize,
      purpose: dto.purpose,
    });

    const publicUrl = res.publicUrl || res.fileUrl || '';
    return {
      ...res,
      publicUrl,
      fileUrl: publicUrl,
    };
  },

  /**
   * Upload binary file directly to storage using the presigned URL
   */
  async uploadDirectly(uploadUrl: string, file: File | Blob): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!res.ok) {
      throw new Error(`Failed to upload file to storage: ${res.statusText}`);
    }
  },

  /**
   * Complete end-to-end media upload:
   * 1. Requests presigned URL from NestJS backend
   * 2. Uploads binary data directly to Cloudflare R2 / S3
   * 3. Returns the permanent public CDN URL
   */
  async uploadMedia(file: File, purpose: MediaUploadPurpose = 'EVENT_GALLERY'): Promise<string> {
    const presigned = await this.getPresignedUrl({
      filename: file.name,
      mimeType: file.type || 'image/jpeg',
      fileSize: file.size,
      purpose,
    });

    await this.uploadDirectly(presigned.uploadUrl, file);
    return presigned.publicUrl;
  },
};
