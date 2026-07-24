'use client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToeic } from '@/hooks/useToeic';
import { ROUTES } from '@/constants/routes';

const PdfViewer = dynamic(() => import('@/components/feature/PdfViewer'), {
  ssr: false,
  loading: () => <div className="p-4">Đang tải PDF...</div>,
});

export default function PracticeV2ResultsPage() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const resultId = searchParams.get('resultId');
  const localResultId = searchParams.get('localResultId');
  const router = useRouter();

  const { useTestSet, useTestQuestions, useTestResult } = useToeic();
  const { data: testSet, isLoading: isTestLoading } = useTestSet(id);
  const { data: questions, isLoading: isQuestionsLoading } =
    useTestQuestions(id);

  // If localResultId exists, we don't fetch from server.
  const { data: serverResultData, isLoading: isServerResultLoading } =
    useTestResult(resultId || '');

  const [localResultData, setLocalResultData] = useState<any>(null);

  useEffect(() => {
    if (localResultId) {
      const stored = sessionStorage.getItem(localResultId);
      if (stored) {
        setLocalResultData(JSON.parse(stored));
      } else {
        toast.error('Không tìm thấy kết quả làm bài!');
        router.push(ROUTES.EXAM_TOEIC);
      }
    }
  }, [localResultId, router]);

  const resultData = localResultId ? localResultData : serverResultData;
  const isResultLoading = resultId
    ? isServerResultLoading
    : localResultId
      ? !localResultData
      : false;

  // PDF Viewer states
  const [activePdf, setActivePdf] = useState<'reading' | 'listening'>(
    'reading',
  );
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [pdfContainerWidth, setPdfContainerWidth] = useState<number>(0);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (testSet) {
      if (!testSet.readingPdfUrl && testSet.listeningPdfUrl) {
        setActivePdf('listening');
      }
    }
  }, [testSet]);

  useEffect(() => {
    if (pdfWrapperRef.current) {
      setPdfContainerWidth(pdfWrapperRef.current.clientWidth);
    }
    const handleResize = () => {
      if (pdfWrapperRef.current)
        setPdfContainerWidth(pdfWrapperRef.current.clientWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  if (isTestLoading || isQuestionsLoading || isResultLoading) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-screen bg-slate-200/50 dark:bg-slate-800/50">
        Đang tải kết quả...
      </div>
    );
  }

  if (!testSet || !resultData || !questions) {
    return (
      <div className="p-8 text-center text-red-500 h-screen flex flex-col items-center justify-center bg-slate-200/50 dark:bg-slate-800/50">
        <p>Không tìm thấy dữ liệu bài thi.</p>
        <Button className="mt-4" onClick={() => router.push(ROUTES.PRACTICE)}>
          Quay Lại
        </Button>
      </div>
    );
  }

  const sortedQuestions = [...questions].sort(
    (a, b) => a.questionNumber - b.questionNumber,
  );
  const userAnswers = resultData.answers || {};

  const currentPdfUrl =
    activePdf === 'reading' ? testSet.readingPdfUrl : testSet.listeningPdfUrl;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b shrink-0 z-10">
        <div className="flex items-center justify-between w-full gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(ROUTES.PRACTICE_TOEIC)}
            className={'bg-slate-200/50 dark:bg-slate-800/50'}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-14 flex-1 shrink-0 flex items-center justify-between px-4 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2">
              {testSet.listeningPdfUrl && (
                <Button
                  variant={activePdf === 'listening' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActivePdf('listening')}
                >
                  Listening PDF
                </Button>
              )}
              {testSet.readingPdfUrl && (
                <Button
                  variant={activePdf === 'reading' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActivePdf('reading')}
                >
                  Reading PDF
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPdfScale(s => Math.max(0.5, s - 0.2))}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <span className="text-xs w-12 text-center">
                {Math.round(pdfScale * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPdfScale(s => Math.min(2.5, s + 0.2))}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-border mx-2" />
              <Button
                variant="outline"
                size="sm"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(p => p - 1)}
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
                onClick={() => setPageNumber(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Tổng điểm
              </span>
              <span className="text-xl font-bold text-primary">
                {resultData.score}
              </span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Listening
              </span>
              <span className="text-lg font-bold text-sky-600">
                {resultData.listeningScore}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Reading
              </span>
              <span className="text-lg font-bold text-emerald-600">
                {resultData.readingScore}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: PDF Viewer */}
        <div className="w-9/12 border-r bg-slate-200/50 dark:bg-slate-800/50 flex flex-col relative">
          <div
            className="flex-1 overflow-auto p-4 custom-scrollbar"
            ref={pdfWrapperRef}
          >
            {currentPdfUrl ? (
              <div className="flex justify-center">
                <PdfViewer
                  file={`/api/proxy-pdf?url=${encodeURIComponent(currentPdfUrl)}`}
                  onLoadSuccess={onDocumentLoadSuccess}
                  pageNumber={pageNumber}
                  scale={pdfScale}
                  width={pdfContainerWidth ? pdfContainerWidth - 40 : undefined}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Đề thi này không có file PDF
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Review Bubble Sheet / Review Interview */}
        <div className={'w-3/12 bg-white dark:bg-slate-900 flex flex-col'}>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="space-y-4">
              {sortedQuestions.map(q => {
                const isPart2 = q.part === '2';
                const opts = isPart2 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
                const userAns = userAnswers[q._id];
                const correctAns = q.correctAnswer?.toUpperCase();
                const isCorrect = userAns === correctAns;

                return (
                  <Card
                    key={q._id}
                    className={`border-l-4 ${isCorrect ? 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20'}`}
                  >
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg w-8">
                            {q.questionNumber}.
                          </span>
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-rose-500" />
                          )}
                          <div
                            className={`text-xs px-2 py-1 rounded-md font-medium ml-1 ${userAns ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}
                          >
                            {userAns ? `Bạn chọn: ${userAns}` : 'Chưa làm'}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {opts.map(opt => {
                            let btnClass =
                              'bg-transparent border-slate-300 text-slate-400';

                            if (opt === correctAns) {
                              btnClass =
                                'bg-emerald-500 border-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/20';
                            } else if (opt === userAns && !isCorrect) {
                              btnClass =
                                'bg-rose-500 border-rose-500 text-white shadow-sm ring-2 ring-rose-500/20';
                            }

                            return (
                              <div
                                key={opt}
                                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold ${btnClass}`}
                              >
                                {opt}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {q.explanation && (
                        <div className="mt-2 p-3 bg-white dark:bg-slate-800 rounded-md border text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-semibold block mb-1">
                            Giải thích:
                          </span>
                          {q.explanation}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
