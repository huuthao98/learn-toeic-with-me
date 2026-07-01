'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  Save,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTests } from '@/hooks/useTests';
import { testsApi } from '@/api/tests';

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function PracticeV2Page() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // API hooks
  const { useTestSet, useTestQuestions } = useTests();
  const { data: testSet, isLoading: isTestLoading } = useTestSet(id);
  const { data: questions, isLoading: isQuestionsLoading } = useTestQuestions(id);

  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(7200); // 120 mins
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // PDF Viewer states
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [pdfContainerWidth, setPdfContainerWidth] = useState<number>(0);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (pdfWrapperRef.current) {
      setPdfContainerWidth(pdfWrapperRef.current.clientWidth);
    }
    const handleResize = () => {
      if (pdfWrapperRef.current) setPdfContainerWidth(pdfWrapperRef.current.clientWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    if (timeLeft === 0) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const durationMinutes = Math.floor((7200 - timeLeft) / 60);

    try {
      const res = await testsApi.submitExam(id, { answers, durationMinutes });
      router.push(`/practice-v2/${id}/results?resultId=${res.resultId}`);
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi nộp bài!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  if (isTestLoading || isQuestionsLoading) {
    return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
  }

  if (!testSet) {
    return <div className="p-8 text-center text-red-500">Không tìm thấy đề thi.</div>;
  }

  // Sort questions just in case
  const sortedQuestions = [...(questions || [])].sort(
    (a, b) => a.question_number - b.question_number,
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="w-1/2 border-r bg-slate-200/50 dark:bg-slate-800/50 flex flex-col relative">
        <div className="flex-1 overflow-auto p-4 custom-scrollbar" ref={pdfWrapperRef}>
          {testSet.pdfUrl ? (
            <div className="flex justify-center">
              <Document
                file={`/api/proxy-pdf?url=${encodeURIComponent(testSet.pdfUrl)}`}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="p-4">Đang tải PDF...</div>}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={pdfScale}
                  width={pdfContainerWidth ? pdfContainerWidth - 40 : undefined}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-xl"
                />
              </Document>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Đề thi này không có file PDF
            </div>
          )}
        </div>
      </div>

      <div className="w-1/2 flex flex-col bg-white dark:bg-slate-900">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b shrink-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">{testSet.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 font-bold px-6 shadow-md"
            >
              {isSubmitting ? 'Đang nộp...' : 'Nộp Bài'}
            </Button>
          </div>
        </header>

        {/* PDF Controls */}
        <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-white dark:bg-slate-900 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPdfScale((s) => Math.max(0.5, s - 0.2))}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(pdfScale * 100)}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPdfScale((s) => Math.min(2.5, s + 0.2))}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-2" />
            <Button
              variant="outline"
              size="sm"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => p - 1)}
            >
              Prev
            </Button>
            <span className="text-xs">
              Trang {pageNumber} / {numPages || '-'}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pageNumber >= (numPages || 1)}
              onClick={() => setPageNumber((p) => p + 1)}
            >
              Next
            </Button>
          </div>
          {testSet.audioUrl && (
            <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2">
              <audio
                ref={audioRef}
                src={testSet.audioUrl}
                onEnded={() => setAudioPlaying(false)}
                className="hidden"
              />
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={toggleAudio}
              >
                {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <div className="text-sm font-medium">Listening Audio</div>
              <audio controls src={testSet.audioUrl} className="h-8 w-48 ml-2" />
            </div>
          )}
        </div>

        {/* Bubble Sheet */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
          <div className="h-14 px-4 border-b shrink-0 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h2 className="font-bold">Phiếu Trả Lời (Bubble Sheet)</h2>
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Thời gian
              </span>
              <span
                className={`text-xl font-mono font-bold ${timeLeft < 300 ? 'text-destructive animate-pulse' : 'text-primary'}`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Đã làm: <span className="text-primary">{Object.keys(answers).length}</span> /{' '}
              {sortedQuestions.length}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              {sortedQuestions.map((q) => {
                const isPart2 = q.part === '2';
                const opts = isPart2 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];

                return (
                  <div
                    key={q._id}
                    className="flex flex-wrap items-center justify-between gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="font-medium w-8 text-right mr-3 text-slate-500">
                      {q.question_number}.
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {opts.map((opt) => {
                        const isSelected = answers[q._id] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectAnswer(q._id, opt)}
                            className={`w-8 h-8 rounded-full border-2 text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-sm'
                                : 'bg-transparent border-slate-300 text-slate-400 hover:border-primary/50 hover:text-primary'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
