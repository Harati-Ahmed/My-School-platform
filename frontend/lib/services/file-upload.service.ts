/**
 * File Upload Service
 * Handles file uploads to Supabase Storage
 */

import { createClient } from '@/lib/supabase/client';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface FileUploadOptions {
  bucket: string;
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  options: FileUploadOptions
): Promise<UploadResult> {
  try {
    // Validate file size
    const maxSize = options.maxSize || MAX_FILE_SIZE;
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
      };
    }

    // Validate file type
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (
        !fileExtension ||
        !options.allowedTypes.includes(fileExtension)
      ) {
        return {
          success: false,
          error: `File type .${fileExtension} is not allowed`,
        };
      }
    }

    const supabase = createClient();

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;

    // Construct path
    const folder = options.folder || '';
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(options.bucket).getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: 'Failed to upload file',
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  options: FileUploadOptions
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file) => uploadFile(file, options));
  return Promise.all(uploadPromises);
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: 'Failed to delete file',
    };
  }
}

/**
 * Get file URL from Supabase Storage
 */
export function getFileUrl(bucket: string, path: string): string {
  const supabase = createClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

/**
 * Download file from URL
 */
export function downloadFileFromUrl(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Predefined upload configurations
 */
export const UPLOAD_CONFIGS = {
  HOMEWORK_ATTACHMENT: {
    bucket: 'homework',
    folder: 'attachments',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
  },
  SCHOOL_LOGO: {
    bucket: 'school',
    folder: 'logos',
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['jpg', 'jpeg', 'png', 'svg'],
  },
  PROFILE_PICTURE: {
    bucket: 'profiles',
    folder: 'pictures',
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['jpg', 'jpeg', 'png'],
  },
  DOCUMENTS: {
    bucket: 'documents',
    folder: 'files',
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'txt',
    ],
  },
} as const;

