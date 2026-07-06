'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file: string;
  onLoadSuccess: (info: { numPages: number }) => void;
  pageNumber: number;
  scale: number;
  width?: number;
}

export default function PdfViewer({
  file,
  onLoadSuccess,
  pageNumber,
  scale,
  width,
}: PdfViewerProps) {
  return (
    <Document
      file={file}
      onLoadSuccess={onLoadSuccess}
      loading={<div className="p-4">Đang tải PDF...</div>}
    >
      <Page
        pageNumber={pageNumber}
        scale={scale}
        width={width}
        renderTextLayer={true}
        renderAnnotationLayer={true}
        className="shadow-xl"
      />
    </Document>
  );
}
