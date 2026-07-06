const fs = require('fs');

let content = fs.readFileSync('src/components/MediaUploadInput.tsx', 'utf8');

// Add imports
content = content.replace(
  "import { UploadCloud, Loader2 } from 'lucide-react';",
  `import { UploadCloud, Loader2, FileArchive } from 'lucide-react';
import { compress } from '@quicktoolsone/pdf-compress';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select';`
);

// Add interface prop
content = content.replace(
  "acceptTypes?: string;\n}",
  "acceptTypes?: string;\n  allowPdfCompression?: boolean;\n}"
);

// Add hooks
content = content.replace(
  "const [isUploading, setIsUploading] = useState(false);",
  `const [isUploading, setIsUploading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState(0);
    const [compressionStatus, setCompressionStatus] = useState('');
    const [enableCompression, setEnableCompression] = useState(false);
    const [compressionPreset, setCompressionPreset] = useState<'lossless' | 'balanced' | 'max'>('balanced');`
);

// Update handleFileChange
content = content.replace(
  `const file = e.target.files?.[0];
      if (!file) return;

      try {
        setIsUploading(true);
        const res = await uploadApi.uploadMedia(file);`,
  `let file = e.target.files?.[0];
      if (!file) return;

      try {
        if (file.type === 'application/pdf' && props.allowPdfCompression && enableCompression) {
          setIsCompressing(true);
          const buffer = await file.arrayBuffer();
          const compressed = await compress(buffer, {
            preset: compressionPreset,
            onProgress: (event) => {
              setCompressionProgress(event.progress);
              setCompressionStatus(event.message || '');
            }
          });
          file = new File([compressed.pdf], file.name, { type: 'application/pdf' });
          setIsCompressing(false);
        }

        setIsUploading(true);
        const res = await uploadApi.uploadMedia(file);`
);

// Catch block fix
content = content.replace(
  `setIsUploading(false);
        if (fileInputRef.current) {`,
  `setIsUploading(false);
        setIsCompressing(false);
        setCompressionProgress(0);
        setCompressionStatus('');
        if (fileInputRef.current) {`
);

// Update return block
content = content.replace(
  `<div className="flex w-full items-center gap-2">
        <Input`,
  `<div className="flex flex-col w-full gap-2">
      <div className="flex w-full items-center gap-2">
        <Input`
);

content = content.replace(
  `</Button>
      </div>
    );`,
  `</Button>
      </div>

      {props.allowPdfCompression && (
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
                  style={{ width: \`\${compressionProgress}%\` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );`
);

fs.writeFileSync('src/components/MediaUploadInput.tsx', content, 'utf8');
console.log('Done');
