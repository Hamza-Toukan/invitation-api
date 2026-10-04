import { apiClient } from './client';

export interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
  category: 'GALLERY' | 'MUSIC' | 'RECEIPT' | 'AVATAR';
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresInSeconds: number;
}

export const mediaApi = {
  /**
   * Request a presigned URL from the backend to upload directly to S3 / Cloudflare R2
   */
  async getPresignedUrl(dto: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    return apiClient.post<PresignedUrlResponse>('/media/presigned-url', dto);
  },

  /**
   * Upload binary file directly to storage using the presigned URL
   */
  async uploadDirectly(uploadUrl: string, file: File | Blob): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!res.ok) {
      throw new Error(`Failed to upload file to storage: ${res.statusText}`);
    }
  },
};
