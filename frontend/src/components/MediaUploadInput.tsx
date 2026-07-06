import { useState, useRef, InputHTMLAttributes, forwardRef, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud, Loader2, FileArchive } from 'lucide-react';
import { compress } from '@quicktoolsone/pdf-compress';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select';
import { uploadApi } from '@/api/upload';

interface MediaUploadInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  acceptTypes?: string;
  allowPdfCompression?: boolean;
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
      allowPdfCompression,
      ...props
    },
    ref,
  ) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState(0);
    const [compressionStatus, setCompressionStatus] = useState('');
    const [enableCompression, setEnableCompression] = useState(false);
    const [compressionPreset, setCompressionPreset] = useState<'lossless' | 'balanced' | 'max'>('balanced');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
      let file = e.target.files?.[0];
      if (!file) return;

      try {
        if (file.type === 'application/pdf' && allowPdfCompression && enableCompression) {
          setIsCompressing(true);
          try {
            const buffer = await file.arrayBuffer();
            const compressed = await compress(buffer, {
              preset: compressionPreset,
              onProgress: (event) => {
                setCompressionProgress(event.progress);
                setCompressionStatus(event.message || '');
              }
            });
            file = new File([compressed.pdf], file.name, { type: 'application/pdf' });
          } catch (compErr: any) {
            console.error('Compression Failed:', compErr);
            if (compErr?.underlyingError) {
              console.error('Underlying Compression Error:', compErr.underlyingError);
              alert('Lỗi nén PDF: ' + compErr.underlyingError.message + '\\nSẽ tải lên file gốc.');
            } else {
              alert('Lỗi nén PDF: ' + compErr.message + '\\nSẽ tải lên file gốc.');
            }
          } finally {
            setIsCompressing(false);
            setCompressionProgress(0);
            setCompressionStatus('');
          }
        }

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
        setIsCompressing(false);
        setCompressionProgress(0);
        setCompressionStatus('');
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
      }
    };

    return (
      <div className="flex flex-col w-full gap-2">
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

      {allowPdfCompression && (
        <div className="flex flex-col gap-2 p-3 bg-secondary/20 rounded-md border border-border/50 text-sm">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-primary w-fit">
            <input 
              type="checkbox" 
              checked={enableCompression} 
              onChange={(e) => setEnableCompression(e.target.checked)} 
              disabled={disabled || isUploading || isCompressing}
              className="rounded border-primary text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            Nén file PDF trước khi tải lên (giảm dung lượng)
          </label>
          
          {enableCompression && (
            <div className="flex flex-col gap-2 pl-6 mt-1">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs font-semibold uppercase">Mức độ:</span>
                <Select
                  value={compressionPreset}
                  onValueChange={(val: any) => setCompressionPreset(val)}
                  disabled={disabled || isUploading || isCompressing}
                >
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue placeholder="Chọn mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lossless">An toàn (Lossless)</SelectItem>
                    <SelectItem value="balanced">Cân bằng (Balanced)</SelectItem>
                    <SelectItem value="max">Tối đa (Max)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {isCompressing && (
            <div className="flex flex-col gap-1.5 pl-6 mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <FileArchive className="h-3.5 w-3.5 animate-pulse text-primary" /> 
                  {compressionStatus || 'Đang chuẩn bị...'}
                </span>
                <span className="font-bold text-primary">{Math.round(compressionProgress)}%</span>
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden shadow-inner border border-border/50">
                <div 
                  className="bg-primary h-full transition-all duration-300" 
                  style={{ width: `${compressionProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
  },
);

MediaUploadInput.displayName = 'MediaUploadInput';
