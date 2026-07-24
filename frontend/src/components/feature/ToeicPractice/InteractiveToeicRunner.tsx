import {
  EyeIcon,
  XCircle,
  Volume2,
  ArrowRight,
  ArrowLeft,
  EyeOffIcon,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToeic, ToeicQuestion } from '@/hooks/useToeic';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InteractiveToeicRunnerProps {
  testSetId: string;
  onBack: () => void;
  questions: ToeicQuestion[];
}

export function InteractiveToeicRunner({
  testSetId,
  onBack,
  questions,
}: InteractiveToeicRunnerProps) {
  const router = useRouter();
  const { useSubmitExamMutation } = useToeic();
  const submitExamMutation = useSubmitExamMutation(testSetId);

  const [mode, setMode] = useState<'practice' | 'exam'>('practice');

  // Group questions by part and setId (or single question) to avoid setId conflicts across different parts
  const groups = useMemo(() => {
    const grouped = questions.reduce<
      Record<
        string,
        {
          key: string;
          passageContext?: string;
          passageType?: string;
          questions: ToeicQuestion[];
        }
      >
    >((acc, q) => {
      const key = q.setId ? `part_${q.part}_set_${q.setId}` : `single_${q._id}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          passageContext: q.passageContext,
          passageType: q.passageType,
          questions: [],
        };
      }
      acc[key].questions.push(q);
      return acc;
    }, {});

    return Object.values(grouped);
  }, [questions]);

  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const timePerQuestion = useMemo(
    () => new Array(questions.length).fill(10000),
    [questions.length],
  );

  const [isFinished, setIsFinished] = useState(false);
  const [isBackModalOpen, setIsBackModalOpen] = useState(false);
  const [isSubmitWarningModalOpen, setIsSubmitWarningModalOpen] =
    useState(false);

  const currentGroup = groups[currentGroupIndex] || groups[0];
  const safeQuestionIndex = Math.min(
    currentQuestionIndex,
    Math.max(0, (currentGroup?.questions.length || 1) - 1),
  );
  const currentQuestion = currentGroup?.questions[safeQuestionIndex];

  const isFirstQuestionOverall =
    currentGroupIndex === 0 && safeQuestionIndex === 0;
  const isLastQuestionOverall =
    currentGroupIndex === groups.length - 1 &&
    safeQuestionIndex === (currentGroup?.questions.length || 1) - 1;

  const handleAnswerSelect = (qId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const handleNext = () => {
    if (safeQuestionIndex < currentGroup.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      handleFinishRequest();
    }
  };

  const handlePrev = () => {
    if (safeQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentGroupIndex > 0) {
      const prevGroup = groups[currentGroupIndex - 1];
      setCurrentGroupIndex(prev => prev - 1);
      setCurrentQuestionIndex(prevGroup.questions.length - 1);
    }
  };

  const executeFinish = async () => {
    setIsFinished(true);
    try {
      const res = await submitExamMutation.mutateAsync({
        answers,
        timePerQuestion,
        isTest: mode === 'exam',
        durationMinutes: 0,
      });

      if (res && res.breakdown) {
        if (res.totalEarned > 0) {
          toast.success(`🎉 Chúc mừng! Bạn nhận được ${res.totalEarned} XP!`, {
            duration: 5000,
          });
        }

        setTimeout(() => {
          if (res.resultId) {
            router.push(
              `/exam-toeic/${testSetId}/results?resultId=${res.resultId}`,
            );
          } else {
            // Guest mode fallback
            const localKeys = Object.keys(sessionStorage).filter(k =>
              k.startsWith('local_toeic_'),
            );
            if (localKeys.length >= 5) {
              localKeys
                .sort()
                .slice(0, localKeys.length - 4)
                .forEach(k => sessionStorage.removeItem(k));
            }

            const localResultId = `local_toeic_${Date.now()}`;
            sessionStorage.setItem(
              localResultId,
              JSON.stringify({
                score: res.score,
                listeningScore: res.listeningScore,
                readingScore: res.readingScore,
                correctCount: res.correctCount,
                answers,
              }),
            );
            router.push(
              `/exam-toeic/${testSetId}/results?localResultId=${localResultId}`,
            );
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Lỗi khi nộp bài:', err);
      toast.error('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
      setIsFinished(false);
    }
  };

  const handleFinishRequest = () => {
    if (Object.keys(answers).length < questions.length) {
      setIsSubmitWarningModalOpen(true);
    } else {
      executeFinish();
    }
  };

  const handleChangeMode = () => {
    setMode(prev => {
      const nextMode = prev === 'practice' ? 'exam' : 'practice';
      toast.info(
        nextMode === 'practice'
          ? 'Đã chuyển sang chế độ Luyện tập (xem đáp án ngay)'
          : 'Đã chuyển sang chế độ Làm đề thi (ẩn đáp án)',
      );
      return nextMode;
    });
  };

  // Render text completion passage (Part 6) by splitting context at placeholders like [131]
  const renderPassageWithBlanks = (text: string) => {
    if (!text) return null;

    const parts = text.split(/(\[\d+\])/g);
    return (
      <div className="text-sm md:text-base leading-relaxed text-foreground whitespace-pre-wrap font-medium font-serif bg-secondary/20 p-4 rounded-xl border border-border/50 shadow-inner">
        {parts.map((part, idx) => {
          if (part.match(/^\[\d+\]$/)) {
            return (
              <span
                key={part + idx}
                className="inline-flex items-center gap-1 mx-1.5 align-baseline font-bold"
              >
                <span className="text-muted-foreground/80 font-mono tracking-tighter">
                  ____
                </span>
                <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-md shadow-2xs border border-primary/30 text-xs sm:text-sm">
                  {part}
                </span>
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  };

  if (!currentGroup || !currentQuestion) return null;

  const selectedAnswer = answers[currentQuestion._id];
  const isCurrentAnswered = !!selectedAnswer;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-11 px-4 pb-24">
      {/* Sticky Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/80 backdrop-blur-md sticky top-16 z-40 pb-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-primary transition-colors"
            onClick={() => {
              if (Object.keys(answers).length > 0) setIsBackModalOpen(true);
              else onBack();
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Button>

          <Button
            variant={mode === 'practice' ? 'outline' : 'default'}
            size="sm"
            className="rounded-lg shadow-xs"
            onClick={handleChangeMode}
          >
            {mode === 'practice' ? (
              <>
                <EyeIcon className="w-4 h-4 mr-2 text-primary" />
                Luyện tập
              </>
            ) : (
              <>
                <EyeOffIcon className="w-4 h-4 mr-2" />
                Thi thử
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="h-9 text-sm px-4 font-semibold shadow-xs rounded-xl flex items-center justify-center border border-border/50 bg-background/50"
          >
            Câu {currentQuestion.questionNumber} / {questions.length}
          </Badge>

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  className="h-9 bg-secondary/40 backdrop-blur-md px-4 rounded-xl border border-border/50 text-sm font-medium shadow-xs flex items-center gap-2"
                />
              }
            >
              Xem danh sách câu hỏi đã làm: {Object.keys(answers).length} /{' '}
              {questions.length}
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 sm:w-96 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <SheetHeader className="mb-4 shrink-0">
                <SheetTitle>Danh sách câu hỏi</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-6">
                {[2, 3, 4, 5, 6, 7].map(partNum => {
                  const partQuestions = questions.filter(
                    q => q.part === String(partNum),
                  );
                  if (partQuestions.length === 0) return null;

                  const answeredPartCount = partQuestions.filter(
                    q => !!answers[q._id],
                  ).length;

                  return (
                    <div key={partNum} className="space-y-3">
                      <div className="flex items-center justify-between border-b pb-1">
                        <h3 className="font-semibold text-sm text-foreground">
                          Part {partNum}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {answeredPartCount}/{partQuestions.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {partQuestions.map(q => {
                          const isAnswered = !!answers[q._id];
                          const gIndex = groups.findIndex(g =>
                            g.questions.some(gq => gq._id === q._id),
                          );
                          const qIndex =
                            gIndex !== -1
                              ? groups[gIndex].questions.findIndex(
                                  gq => gq._id === q._id,
                                )
                              : -1;
                          const isCurrent =
                            gIndex === currentGroupIndex &&
                            qIndex === safeQuestionIndex;

                          return (
                            <Button
                              key={q._id}
                              variant={isAnswered ? 'default' : 'outline'}
                              className={`h-10 w-full p-0 text-xs font-semibold transition-all ${
                                isAnswered
                                  ? 'bg-primary text-primary-foreground shadow-xs'
                                  : 'text-foreground hover:border-primary/50'
                              } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                              onClick={() => {
                                if (gIndex !== -1) {
                                  setCurrentGroupIndex(gIndex);
                                  setCurrentQuestionIndex(
                                    qIndex !== -1 ? qIndex : 0,
                                  );
                                }
                              }}
                            >
                              {q.questionNumber}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content Area */}
      {!isFinished ? (
        <div className="animate-in fade-in duration-300">
          {currentGroup.passageContext ? (
            /* Parallel Dual Card Layout (Equal Height & Width on Desktop) */
            <div className="flex flex-col gap-2 items-stretch  min-h-[450px]">
              {/* Left Column: Passage Card */}
              <Card className="flex flex-col gap-0 overflow-hidden border-border/40 shadow-md bg-card">
                <CardHeader className="bg-secondary/30 pt-4 pb-3 px-6 border-b border-border/10 shrink-0 flex flex-row items-center justify-between">
                  <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20">
                    {currentQuestion.part === '6'
                      ? 'Part 6: Text Completion'
                      : 'Part 7: Reading Comprehension'}
                  </Badge>
                  {currentGroup.passageType && (
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {currentGroup.passageType} PASSAGE
                    </span>
                  )}
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                  {currentQuestion.part === '6' ? (
                    renderPassageWithBlanks(currentGroup.passageContext)
                  ) : (
                    <div className="text-sm md:text-base leading-relaxed text-foreground whitespace-pre-wrap font-serif bg-secondary/10 p-2 rounded-xl border border-border/40 shadow-inner">
                      {currentGroup.passageContext}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Column: Question Card */}
              <Card className="flex flex-col gap-0 h-full overflow-hidden border-border/40 shadow-md bg-card">
                <CardHeader className="bg-secondary/30 pt-4 pb-3 px-6 border-b border-border/10 shrink-0 space-y-3">
                  {/* Sub-tabs for questions inside current group if > 1 */}
                  {currentGroup.questions.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 custom-scrollbar">
                      <span className="text-xs font-semibold text-muted-foreground shrink-0">
                        Các câu trong bài:
                      </span>
                      {currentGroup.questions.map((gq, idx) => {
                        const isAns = !!answers[gq._id];
                        const isSel = idx === safeQuestionIndex;
                        return (
                          <Button
                            key={gq._id}
                            size="sm"
                            variant={
                              isSel
                                ? 'default'
                                : isAns
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className={`h-7 px-2.5 text-xs font-bold rounded-lg transition-all ${
                              isSel
                                ? 'shadow-xs ring-2 ring-primary ring-offset-1'
                                : ''
                            }`}
                            onClick={() => setCurrentQuestionIndex(idx)}
                          >
                            Câu {gq.questionNumber}
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {!currentQuestion.setId ||
                    (currentQuestion.questionText && (
                      <CardTitle className="text-lg md:text-xl font-bold flex gap-3 items-start">
                        {!currentQuestion.setId && (
                          <span className="text-primary shrink-0 bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold">
                            Câu {currentQuestion.questionNumber}
                          </span>
                        )}
                        <span className="leading-snug pt-1">
                          {currentQuestion.questionText}
                        </span>
                      </CardTitle>
                    ))}

                  {currentQuestion.audioUrl && (
                    <div className="mt-2 flex items-center gap-3 p-2 rounded-lg bg-background border border-border/50">
                      <Volume2 className="w-4 h-4 text-primary shrink-0" />
                      <audio
                        controls
                        src={currentQuestion.audioUrl}
                        className="w-full h-8"
                      />
                    </div>
                  )}

                  {currentQuestion.imageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-border/50 max-w-lg">
                      <img
                        src={currentQuestion.imageUrl}
                        alt={`Câu ${currentQuestion.questionNumber}`}
                        className="w-full h-auto object-contain max-h-60"
                      />
                    </div>
                  )}
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuestion.options?.map(opt => {
                      let btnClass =
                        'justify-start h-auto min-h-12 py-3 px-4 text-left border-2 transition-all duration-200 rounded-xl font-medium ';

                      if (mode === 'exam') {
                        btnClass +=
                          selectedAnswer === opt.label
                            ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                            : 'border-border/50 hover:border-primary/50 hover:bg-secondary/50 text-foreground';
                      } else {
                        if (isCurrentAnswered) {
                          if (opt.label === currentQuestion.correctAnswer) {
                            btnClass +=
                              'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm';
                          } else if (selectedAnswer === opt.label) {
                            btnClass +=
                              'border-destructive bg-destructive/10 text-destructive font-bold';
                          } else {
                            btnClass += 'border-border/30 opacity-50';
                          }
                        } else {
                          btnClass +=
                            'border-border/50 hover:border-primary/50 hover:bg-secondary/50';
                        }
                      }

                      return (
                        <Button
                          key={opt.label}
                          variant="outline"
                          className={btnClass}
                          onClick={() =>
                            !isCurrentAnswered || mode === 'exam'
                              ? handleAnswerSelect(
                                  currentQuestion._id,
                                  opt.label,
                                )
                              : undefined
                          }
                          disabled={isCurrentAnswered && mode === 'practice'}
                        >
                          <div className="flex w-full items-center">
                            <span className="font-bold mr-3 shrink-0 text-muted-foreground w-6 h-6 flex items-center justify-center bg-background rounded-md shadow-xs border border-border/50 text-xs">
                              {opt.label}
                            </span>
                            <span className="text-sm md:text-base whitespace-normal break-words leading-relaxed">
                              {opt.text}
                            </span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>

                  {mode === 'practice' && isCurrentAnswered && (
                    <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 mb-2">
                        {selectedAnswer === currentQuestion.correctAnswer ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              Chính xác!
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-destructive shrink-0" />
                            <span className="font-bold text-destructive">
                              Chưa chính xác! (Đáp án đúng:{' '}
                              {currentQuestion.correctAnswer})
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed mt-2">
                        <span className="font-semibold text-primary">
                          Giải thích:{' '}
                        </span>
                        {currentQuestion.explanation ||
                          'Không có giải thích chi tiết.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Centered Column for Standalone Questions (Part 5) */
            <div className="max-w-3xl mx-auto w-full space-y-6">
              <Badge className="mb-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">
                Part 5: Incomplete Sentences
              </Badge>

              <Card className="overflow-hidden border-border/40 shadow-md bg-card transition-all duration-200">
                <CardHeader className="bg-secondary/30 pt-5 pb-4 border-b border-border/10">
                  <CardTitle className="text-lg md:text-xl font-bold flex gap-3 items-center">
                    <span className="text-primary shrink-0 bg-primary/10 p-2 rounded-xl flex items-center justify-center text-sm font-extrabold">
                      Câu {currentQuestion.questionNumber}
                    </span>
                    <span className="leading-snug pt-1">
                      {currentQuestion.questionText}
                    </span>
                  </CardTitle>

                  {currentQuestion.audioUrl && (
                    <div className="mt-3 flex items-center gap-3 p-2 rounded-lg bg-background border border-border/50">
                      <Volume2 className="w-4 h-4 text-primary shrink-0" />
                      <audio
                        controls
                        src={currentQuestion.audioUrl}
                        className="w-full h-8"
                      />
                    </div>
                  )}

                  {currentQuestion.imageUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-border/50 max-w-lg">
                      <img
                        src={currentQuestion.imageUrl}
                        alt={`Câu ${currentQuestion.questionNumber}`}
                        className="w-full h-auto object-contain max-h-80"
                      />
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuestion.options?.map(opt => {
                      let btnClass =
                        'justify-start h-auto min-h-12 py-3 px-4 text-left border-2 transition-all duration-200 rounded-xl font-medium ';

                      if (mode === 'exam') {
                        btnClass +=
                          selectedAnswer === opt.label
                            ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                            : 'border-border/50 hover:border-primary/50 hover:bg-secondary/50 text-foreground';
                      } else {
                        if (isCurrentAnswered) {
                          if (opt.label === currentQuestion.correctAnswer) {
                            btnClass +=
                              'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm';
                          } else if (selectedAnswer === opt.label) {
                            btnClass +=
                              'border-destructive bg-destructive/10 text-destructive font-bold';
                          } else {
                            btnClass += 'border-border/30 opacity-50';
                          }
                        } else {
                          btnClass +=
                            'border-border/50 hover:border-primary/50 hover:bg-secondary/50';
                        }
                      }

                      return (
                        <Button
                          key={opt.label}
                          variant="outline"
                          className={btnClass}
                          onClick={() =>
                            !isCurrentAnswered || mode === 'exam'
                              ? handleAnswerSelect(
                                  currentQuestion._id,
                                  opt.label,
                                )
                              : undefined
                          }
                          disabled={isCurrentAnswered && mode === 'practice'}
                        >
                          <div className="flex w-full items-center">
                            <span className="font-bold mr-3 shrink-0 text-muted-foreground w-6 h-6 flex items-center justify-center bg-background rounded-md shadow-xs border border-border/50 text-xs">
                              {opt.label}
                            </span>
                            <span className="text-sm md:text-base whitespace-normal break-words leading-relaxed">
                              {opt.text}
                            </span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>

                  {mode === 'practice' && isCurrentAnswered && (
                    <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2">
                        {selectedAnswer === currentQuestion.correctAnswer ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              Chính xác!
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-destructive shrink-0" />
                            <span className="font-bold text-destructive">
                              Chưa chính xác! (Đáp án đúng:{' '}
                              {currentQuestion.correctAnswer})
                            </span>
                          </>
                        )}
                      </div>
                      {currentQuestion.explanation && (
                        <p className="text-sm text-foreground leading-relaxed mt-4">
                          <span className="font-semibold text-primary">
                            Giải thích:{' '}
                          </span>
                          {currentQuestion.explanation ||
                            'Không có giải thích chi tiết.'}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        /* Submitting Loader State */
        <Card className="p-12 text-center border-border/40 bg-secondary/10 shadow-xs rounded-2xl animate-in fade-in duration-500 max-w-md mx-auto mt-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-6" />
          <p className="text-xl text-primary font-bold">Đang nộp bài...</p>
          <p className="text-muted-foreground mt-2">
            Vui lòng đợi trong giây lát để xem kết quả chi tiết.
          </p>
        </Card>
      )}

      {/* Fixed Bottom Navigation Footer */}
      {!isFinished && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="w-32 rounded-xl font-semibold shadow-xs hover:bg-secondary/80"
              onClick={handlePrev}
              disabled={isFirstQuestionOverall}
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Trước
            </Button>

            {!isLastQuestionOverall ? (
              <Button
                size="lg"
                className="w-32 rounded-xl font-bold shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all"
                onClick={handleNext}
              >
                Tiếp <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                size="lg"
                variant="default"
                className="w-32 rounded-xl font-bold shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
                onClick={handleFinishRequest}
              >
                Nộp bài <CheckCircle className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={isBackModalOpen}
        onClose={() => setIsBackModalOpen(false)}
        onConfirm={() => {
          setIsBackModalOpen(false);
          onBack();
        }}
        title="Thoát bài kiểm tra?"
        description="Bạn có chắc chắn muốn thoát? Mọi tiến trình làm bài của bạn sẽ bị mất và không thể khôi phục."
        confirmText="Thoát luôn"
        cancelText="Tiếp tục làm bài"
        variant="destructive"
      />

      <ConfirmModal
        isOpen={isSubmitWarningModalOpen}
        onClose={() => setIsSubmitWarningModalOpen(false)}
        onConfirm={() => {
          setIsSubmitWarningModalOpen(false);
          executeFinish();
        }}
        title="Nộp bài sớm?"
        description={`Bạn mới hoàn thành ${Object.keys(answers).length}/${questions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài lúc này không?`}
        confirmText="Nộp bài luôn"
        cancelText="Quay lại làm tiếp"
        variant="default"
      />
    </div>
  );
}
