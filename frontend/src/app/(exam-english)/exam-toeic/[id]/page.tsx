'use client';

import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Play, Pause, Maximize2, Minimize2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToeic } from '@/hooks/useToeic';
import { toeicApi } from '@/api/toeic';

const PdfViewer = dynamic(() => import('@/components/feature/PdfViewer'), {
  ssr: false,
  loading: () => <div className="p-4">Đang tải PDF...</div>,
});

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function PracticeV2Page() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // API hooks
  const { useTestSet, useTestQuestions } = useToeic();
  const { data: testSet, isLoading: isTestLoading } = useTestSet(id);
  const { data: questions, isLoading: isQuestionsLoading } =
    useTestQuestions(id);

  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(7200); // 120 mins
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // PDF Viewer states
  const [activePdf, setActivePdf] = useState<'reading' | 'listening'>(
    'listening',
  );
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
      if (pdfWrapperRef.current)
        setPdfContainerWidth(pdfWrapperRef.current.clientWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
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
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (Object.keys(answers).length === 0) {
      toast.warning(
        'Bạn chưa chọn đáp án nào. Vui lòng làm ít nhất một câu trước khi nộp bài!',
      );
      return;
    }

    setIsSubmitting(true);
    const durationMinutes = Math.floor((7200 - timeLeft) / 60);

    try {
      const res = await toeicApi.submitExam(id, { answers, durationMinutes });
      router.push(`/exam-toeic/${id}/results?resultId=${res.resultId}`);
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi nộp bài!');
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
    return (
      <div className="p-8 text-center bg-slate-200/50 dark:bg-slate-800/50">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!testSet) {
    return (
      <div className="p-8 text-center text-red-500 bg-slate-200/50 dark:bg-slate-800/50">
        Không tìm thấy đề thi.
      </div>
    );
  }

  // Sort questions just in case
  const sortedQuestions = [...(questions || [])].sort(
    (a, b) => a.questionNumber - b.questionNumber,
  );

  const currentPdfUrl =
    activePdf === 'reading' ? testSet.readingPdfUrl : testSet.listeningPdfUrl;

  // const toggleUI = (
  //   <div className="flex items-center p-1 rounded-xl bg-secondary/40 border border-border/50">
  //     <Button
  //       variant="ghost"
  //       size="sm"
  //       className="rounded-lg"
  //       onClick={() => router.push(`/practice-exam-toeic/${id}`)}
  //     >
  //       <LayoutList className="w-4 h-4 mr-2" />
  //       Tương tác
  //     </Button>
  //     <Button
  //       variant="default"
  //       size="sm"
  //       className="rounded-lg shadow-sm"
  //     >
  //       <FileText className="w-4 h-4 mr-2" />
  //       PDF
  //     </Button>
  //   </div>
  // );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="flex-1 border-r bg-slate-200/50 dark:bg-slate-800/50 flex flex-col relative">
        {/* PDF Tabs */}
        {(testSet.readingPdfUrl || testSet.listeningPdfUrl) && (
          <>
            <div className="flex p-2 gap-2 bg-white dark:bg-slate-900 border-b shrink-0 z-10 justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {testSet.listeningPdfUrl && (
                    <Button
                      variant={
                        activePdf === 'listening' ? 'default' : 'outline'
                      }
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
              </div>
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
          </>
        )}

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

      <div className="w-full lg:w-[45%] flex-1 lg:flex-none flex flex-col bg-white dark:bg-slate-900 min-h-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="bg-slate-200/50 dark:bg-slate-800/50"
            >
              Back
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
        <div className="h-14 shrink-0 flex items-center justify-between p-4 bg-white dark:bg-slate-900 ">
          {testSet.audioUrl && (
            <div className="flex items-center gap-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2">
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
                {audioPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <div className="text-sm font-medium">Listening Audio</div>
              <audio controls src={testSet.audioUrl} className="h-8 w-full" />
            </div>
          )}
        </div>

        {/* Bubble Sheet */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
          <div className="h-14 px-4 border-b shrink-0 flex justify-between items-center">
            <h2 className="font-bold">Phiếu Trả Lời (Bubble Sheet)</h2>

            <div className="text-sm font-medium text-muted-foreground">
              Đã làm:{' '}
              <span className="text-primary">
                {Object.keys(answers).length}
              </span>{' '}
              / {sortedQuestions.length}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {(() => {
              const groupedQuestions = sortedQuestions.reduce(
                (acc, q) => {
                  if (!acc[q.part]) acc[q.part] = [];
                  acc[q.part].push(q);
                  return acc;
                },
                {} as Record<string, typeof sortedQuestions>,
              );

              return (
                <div className="space-y-8">
                  {Object.keys(groupedQuestions)
                    .sort((a, b) => Number(a) - Number(b))
                    .map(part => (
                      <div key={part}>
                        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200">
                          Part {part}
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-2">
                          {groupedQuestions[part].map((q: any) => {
                            const isPart2 = q.part === '2';
                            const opts = isPart2
                              ? ['A', 'B', 'C']
                              : ['A', 'B', 'C', 'D'];

                            return (
                              <div
                                key={q._id}
                                className="flex items-center justify-start gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <span className="font-medium w-8 text-right mr-3 text-slate-500">
                                  {q.questionNumber}.
                                </span>
                                <div className="flex flex-wrap gap-1.5 2xl:gap-2">
                                  {opts.map(opt => {
                                    const isSelected = answers[q._id] === opt;
                                    return (
                                      <Button
                                        key={opt}
                                        onClick={() =>
                                          handleSelectAnswer(q._id, opt)
                                        }
                                        className={`w-7 h-7 2xl:w-8 2xl:h-8 shrink-0 flex items-center justify-center rounded-full border-2 text-[10px] 2xl:text-xs font-bold transition-all ${
                                          isSelected
                                            ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-sm'
                                            : 'bg-transparent border-slate-300 text-slate-400 hover:border-primary/50 hover:text-primary'
                                        }`}
                                      >
                                        {opt}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
