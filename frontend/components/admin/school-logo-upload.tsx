'use client';

/**
 * School Logo Upload Component
 * Allows admin to upload and manage school logo
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  uploadFile,
  UPLOAD_CONFIGS,
} from '@/lib/services/file-upload.service';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface SchoolLogoUploadProps {
  currentLogoUrl?: string;
  onUploadSuccess?: (url: string) => void;
}

export function SchoolLogoUpload({
  currentLogoUrl,
  onUploadSuccess,
}: SchoolLogoUploadProps) {
  const t = useTranslations();
  const [logoUrl, setLogoUrl] = useState<string | undefined>(currentLogoUrl);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    currentLogoUrl
  );

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload an image file (PNG, JPG, or SVG)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      toast.loading(t('phase5.fileUpload.uploading'));

      const result = await uploadFile(file, {
        ...UPLOAD_CONFIGS.SCHOOL_LOGO,
        allowedTypes: [...UPLOAD_CONFIGS.SCHOOL_LOGO.allowedTypes],
      });

      toast.dismiss();

      if (result.success && result.url) {
        setLogoUrl(result.url);
        toast.success(t('phase5.fileUpload.uploaded'));

        if (onUploadSuccess) {
          onUploadSuccess(result.url);
        }
      } else {
        toast.error(result.error || t('phase5.fileUpload.failed'));
        setPreviewUrl(currentLogoUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.dismiss();
      toast.error(t('phase5.fileUpload.failed'));
      setPreviewUrl(currentLogoUrl);
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    setLogoUrl(undefined);
    setPreviewUrl(undefined);
    if (onUploadSuccess) {
      onUploadSuccess('');
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">
            {t('phase5.fileUpload.schoolLogo')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('phase5.fileUpload.logoDesc')}
          </p>
        </div>

        <div className="flex items-start gap-6">
          {/* Logo Preview */}
          <div className="relative h-32 w-32 overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt="School Logo"
                  fill
                  className="object-contain p-2"
                />
                {!uploading && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeLogo}
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-3">
            <div>
              <input
                type="file"
                id="logo-upload"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              <Button
                type="button"
                variant={previewUrl ? 'outline' : 'default'}
                onClick={() =>
                  document.getElementById('logo-upload')?.click()
                }
                disabled={uploading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {previewUrl
                  ? t('phase5.fileUpload.replaceFile')
                  : t('phase5.fileUpload.uploadLogo')}
              </Button>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• {t('phase5.fileUpload.maxSize')}: 2MB</p>
              <p>• {t('phase5.fileUpload.allowedTypes')}: PNG, JPG, SVG</p>
              <p>• Recommended: 512x512px square image</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

