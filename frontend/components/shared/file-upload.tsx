'use client';

/**
 * File Upload Component
 * Reusable drag-and-drop file upload with Supabase Storage integration
 */

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  Upload,
  X,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  uploadFile,
  uploadMultipleFiles,
  FileUploadOptions,
  UploadResult,
} from '@/lib/services/file-upload.service';
import toast from 'react-hot-toast';

interface FileUploadProps {
  options: FileUploadOptions;
  multiple?: boolean;
  onUploadComplete?: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxFiles?: number;
  className?: string;
}

export function FileUpload({
  options,
  multiple = false,
  onUploadComplete,
  onUploadError,
  accept,
  maxFiles = 5,
  className,
}: FileUploadProps) {
  const t = useTranslations();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);

    if (multiple) {
      const totalFiles = files.length + fileArray.length;
      if (totalFiles > maxFiles) {
        toast.error(
          `Maximum ${maxFiles} files allowed. You selected ${totalFiles} files.`
        );
        return;
      }
      setFiles([...files, ...fileArray.slice(0, maxFiles - files.length)]);
    } else {
      setFiles([fileArray[0]]);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setUploadResults(uploadResults.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    try {
      setUploading(true);
      toast.loading(t('phase5.fileUpload.uploading'));

      let results: UploadResult[];

      if (multiple) {
        results = await uploadMultipleFiles(files, options);
      } else {
        const result = await uploadFile(files[0], options);
        results = [result];
      }

      setUploadResults(results);

      const failedUploads = results.filter((r) => !r.success);
      const successfulUploads = results.filter((r) => r.success);

      toast.dismiss();

      if (failedUploads.length > 0) {
        toast.error(
          `${failedUploads.length} file(s) failed to upload: ${failedUploads.map((r) => r.error).join(', ')}`
        );
        if (onUploadError) {
          onUploadError(failedUploads.map((r) => r.error).join(', '));
        }
      }

      if (successfulUploads.length > 0) {
        toast.success(
          `${successfulUploads.length} file(s) uploaded successfully`
        );
        if (onUploadComplete) {
          onUploadComplete(successfulUploads);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.dismiss();
      toast.error(t('phase5.fileUpload.failed'));
      if (onUploadError) {
        onUploadError('Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className={className}>
      <div className="p-6">
        {/* Upload Area */}
        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg bg-muted p-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>

            <div>
              <p className="text-sm font-medium">
                {t('phase5.fileUpload.dragDrop')}
              </p>
              {options.maxSize && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('phase5.fileUpload.maxSize')}:{' '}
                  {formatFileSize(options.maxSize)}
                </p>
              )}
              {options.allowedTypes && options.allowedTypes.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('phase5.fileUpload.allowedTypes')}:{' '}
                  {options.allowedTypes.join(', ')}
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              {t('phase5.fileUpload.selectFile')}
            </Button>
          </div>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">
              {t('common.selected')} ({files.length})
            </h4>
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border bg-muted/50 p-3"
              >
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {uploadResults[index] && (
                    <>
                      {uploadResults[index].success ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                    </>
                  )}
                  {!uploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && uploadResults.length === 0 && (
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFiles([]);
                setUploadResults([]);
              }}
              disabled={uploading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('phase5.fileUpload.uploading')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {t('phase5.fileUpload.uploadFile')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

