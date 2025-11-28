'use client';

/**
 * Homework Attachment Upload Component
 * Allows teachers to upload homework files and attachments
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, File, X, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  uploadMultipleFiles,
  UPLOAD_CONFIGS,
  UploadResult,
  downloadFileFromUrl,
} from '@/lib/services/file-upload.service';
import { formatFileSize } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

interface HomeworkAttachmentUploadProps {
  existingAttachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  maxFiles?: number;
}

export function HomeworkAttachmentUpload({
  existingAttachments = [],
  onAttachmentsChange,
  maxFiles = 5,
}: HomeworkAttachmentUploadProps) {
  const t = useTranslations();
  const [attachments, setAttachments] = useState<Attachment[]>(
    existingAttachments
  );
  const [uploading, setUploading] = useState(false);
  const uploadConfig = UPLOAD_CONFIGS.HOMEWORK_ATTACHMENT;
  const maxSizeMb = uploadConfig.maxSize
    ? Math.round(uploadConfig.maxSize / (1024 * 1024))
    : 0;
  const allowedTypesLabel = uploadConfig.allowedTypes
    ? uploadConfig.allowedTypes.map((type) => type.toUpperCase()).join(', ')
    : '';

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Check max files limit
    if (attachments.length + fileArray.length > maxFiles) {
      toast.error(
        t('phase5.fileUpload.maxFilesExceeded', { count: maxFiles })
      );
      return;
    }

    try {
      setUploading(true);
      toast.loading(t('phase5.fileUpload.uploading'));

      const results = await uploadMultipleFiles(fileArray, {
        ...uploadConfig,
        allowedTypes: [...uploadConfig.allowedTypes],
      });

      toast.dismiss();

      const successfulUploads = results.filter((r) => r.success);
      const failedUploads = results.filter((r) => !r.success);

      if (successfulUploads.length > 0) {
        const newAttachments: Attachment[] = successfulUploads.map(
          (result, index) => ({
            id: Math.random().toString(36).substring(7),
            name: fileArray[index].name,
            url: result.url!,
            size: fileArray[index].size,
            type: fileArray[index].type,
            uploadedAt: new Date(),
          })
        );

        const updatedAttachments = [...attachments, ...newAttachments];
        setAttachments(updatedAttachments);

        if (onAttachmentsChange) {
          onAttachmentsChange(updatedAttachments);
        }

        toast.success(
          t('phase5.fileUpload.uploadSuccessCount', {
            count: successfulUploads.length,
          })
        );
      }

      if (failedUploads.length > 0) {
        toast.error(
          t('phase5.fileUpload.uploadFailureCount', {
            count: failedUploads.length,
          })
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.dismiss();
      toast.error(t('phase5.fileUpload.failed'));
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    const updatedAttachments = attachments.filter((a) => a.id !== id);
    setAttachments(updatedAttachments);

    if (onAttachmentsChange) {
      onAttachmentsChange(updatedAttachments);
    }

    toast.success(t('phase5.fileUpload.attachmentRemoved'));
  };

  const downloadAttachment = (attachment: Attachment) => {
    downloadFileFromUrl(attachment.url, attachment.name);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">
            {t('phase5.fileUpload.attachments')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('phase5.fileUpload.homeworkFileDesc')}
          </p>
        </div>

        {/* Upload Button */}
        <div>
          <input
            type="file"
            id="attachment-upload"
            multiple
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            disabled={uploading || attachments.length >= maxFiles}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              document.getElementById('attachment-upload')?.click()
            }
            disabled={uploading || attachments.length >= maxFiles}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {t('phase5.fileUpload.selectFile')}
          </Button>

          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>
              •{' '}
              {t('phase5.fileUpload.maxSizeDetail', {
                size: maxSizeMb,
              })}
            </p>
            <p>
              •{' '}
              {t('phase5.fileUpload.allowedTypesDetail', {
                types: allowedTypesLabel,
              })}
            </p>
            <p>
              •{' '}
              {t('phase5.fileUpload.selectMultipleLimit', {
                count: maxFiles,
              })}
            </p>
            <p>
              •{' '}
              {t('phase5.fileUpload.currentCount', {
                count: attachments.length,
                max: maxFiles,
              })}
            </p>
          </div>
        </div>

        {/* Attachments List */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {t('phase5.fileUpload.attachments')} ({attachments.length})
            </h4>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/50 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <File className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)} •{' '}
                        {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadAttachment(attachment)}
                      title={t('phase5.fileUpload.downloadFile')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {!uploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(attachment.id)}
                        title={t('phase5.fileUpload.removeFile')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {attachments.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              {t('phase5.fileUpload.noAttachments')}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

