import { useState, useRef, InputHTMLAttributes, forwardRef, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud, Loader2 } from 'lucide-react';
import { uploadApi } from '@/api/upload';

interface MediaUploadInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  acceptTypes?: string;
}

export const MediaUploadInput = forwardRef<HTMLInputElement, MediaUploadInputProps>(
  (
    {
      className,
      disabled,
      value,
      onChange,
      onUploadSuccess,
      onUploadError,
      acceptTypes = 'audio/*,video/*,image/*',
      ...props
    },
    ref,
  ) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setIsUploading(true);
        const res = await uploadApi.uploadMedia(file);

        // Trigger onChange to integrate seamlessly with react-hook-form
        if (onChange) {
          const event = {
            target: { value: res.url, name: props.name },
          } as ChangeEvent<HTMLInputElement>;
          onChange(event);
        }

        if (onUploadSuccess) onUploadSuccess(res.url);
      } catch (error: any) {
        console.error('Upload Error:', error);
        if (onUploadError) onUploadError(error.response?.data?.message || 'Tải file thất bại');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
      }
    };

    return (
      <div className="flex w-full items-center gap-2">
        <Input
          ref={ref}
          className={`flex-1 ${className || ''}`}
          disabled={disabled || isUploading}
          value={value}
          onChange={onChange}
          {...props}
        />
        <input
          type="file"
          accept={acceptTypes}
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 px-3 border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer"
          title="Tải lên máy chủ"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <UploadCloud className="h-4 w-4 text-primary" />
          )}
        </Button>
      </div>
    );
  },
);

MediaUploadInput.displayName = 'MediaUploadInput';
