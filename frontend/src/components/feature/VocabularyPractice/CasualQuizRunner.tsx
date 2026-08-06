import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trophy,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useVocabulary } from '@/hooks/useVocabulary';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CasualQuizRunnerProps {
  testSetId: string;
  mode?: 'practice' | 'exam';
  onBack: () => void;
  onRestart: () => void;
}

export function CasualQuizRunner({ testSetId, mode = 'practice', onBack }: CasualQuizRunnerProps) {
  const { useTestSet, useTestQuestionsInfinite, useSubmitExamMutation } = useVocabulary();

  const { data: testSet, isLoading: isTestSetLoading } = useTestSet(testSetId);
  const {
    data: infiniteData,
    isLoading: isQuestionsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTestQuestionsInfinite(testSetId, 20);

  const submitExamMutation = useSubmitExamMutation(testSetId);

  const apiQuestions = infiniteData?.pages.flat() || [];
  const currentQuestions =
    apiQuestions.map((q: any) => ({
      id: q._id,
      word: q.questionText,
      type: 'vocabulary',
      pinyin: q.pinyin,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      setId: q.setId,
      passageContext: q.passageContext,
      options:
        q.options?.map((opt: any) => ({
          id: opt.label,
          value: opt.text,
          pinyin: opt.pinyin,
        })) || [],
    })) || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isBackModalOpen, setIsBackModalOpen] = useState(false);
  const [isSubmitWarningModalOpen, setIsSubmitWarningModalOpen] = useState(false);

  useEffect(() => {
    if (currentIndex >= currentQuestions.length - 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [currentIndex, currentQuestions.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const currentQuestion = currentQuestions[currentIndex] || currentQuestions[0];
  const passageContext =
    currentQuestion?.passageContext ||
    (currentQuestion?.setId
      ? currentQuestions.find((q: any) => q.setId === currentQuestion.setId && q.passageContext)
          ?.passageContext
      : null);

  const handleSelectAnswer = (answerId: string) => {
    if (mode === 'practice' && isAnswered) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const newTimeArr = [...timePerQuestion];
    newTimeArr[currentIndex] = timeSpent;
    setTimePerQuestion(newTimeArr);

    setSelectedAnswer(answerId);

    if (mode === 'practice') {
      setIsAnswered(true);
      if (answerId === currentQuestion.correctAnswer) {
        setScore(prev => prev + 1);
      }
    }

    const newAnswers = { ...answers, [currentQuestion.id]: answerId };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);

      const nextQ = currentQuestions[currentIndex + 1];
      const nextAnswer = answers[nextQ?.id] || null;
      setSelectedAnswer(nextAnswer);
      setIsAnswered(mode === 'practice' ? !!nextAnswer : false);

      setQuestionStartTime(Date.now());
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);

      const prevQ = currentQuestions[currentIndex - 1];
      const prevAnswer = answers[prevQ?.id] || null;
      setSelectedAnswer(prevAnswer);
      setIsAnswered(mode === 'practice' ? !!prevAnswer : false);

      setQuestionStartTime(Date.now());
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || isBackModalOpen || isSubmitWarningModalOpen) return;

      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else {
        const keyMap: Record<string, string> = {
          a: 'A',
          s: 'B',
          d: 'C',
          f: 'D',
        };
        const mappedOption = keyMap[e.key.toLowerCase()];
        if (mappedOption && currentQuestion?.options?.some((o: any) => o.id === mappedOption)) {
          handleSelectAnswer(mappedOption);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFinished,
    isBackModalOpen,
    isSubmitWarningModalOpen,
    handleNext,
    handlePrev,
    handleSelectAnswer,
    currentQuestion,
  ]);

  const router = useRouter();

  const executeFinish = async () => {
    setIsFinished(true);
    try {
      const res = await submitExamMutation.mutateAsync({
        answers,
        timePerQuestion,
        isTest: false,
      });

      if (res && res.breakdown) {
        if (res.totalEarned > 0) {
          toast.success(`🎉 Chúc mừng! Bạn nhận được ${res.totalEarned} XP!`, {
            description: 'Tiếp tục duy trì thói quen học mỗi ngày nhé!',
            duration: 5000,
          });
        }

        setTimeout(() => {
          if (res.resultId) {
            router.push(`/practice/vocabulary/${testSetId}/results?resultId=${res.resultId}`);
          } else {
            // Guest user: save local result to sessionStorage and redirect

            // Xử lý dọn dẹp sessionStorage (chỉ giữ lại 5 kết quả gần nhất để tránh tràn bộ nhớ)
            const localKeys = Object.keys(sessionStorage).filter(k => k.startsWith('local_'));
            if (localKeys.length >= 5) {
              // Xóa các kết quả cũ nhất, chỉ giữ lại 4 kết quả mới nhất để chừa chỗ cho kết quả thứ 5
              localKeys
                .sort()
                .slice(0, localKeys.length - 4)
                .forEach(k => sessionStorage.removeItem(k));
            }

            const localResultId = `local_${Date.now()}`;
            sessionStorage.setItem(
              localResultId,
              JSON.stringify({
                score: Object.keys(answers).filter(qId => {
                  const q = currentQuestions.find((q: any) => q.id === qId);
                  return q && answers[qId] === q.correctAnswer;
                }).length,
                answers,
              }),
            );
            router.push(`/practice/vocabulary/${testSetId}/results?localResultId=${localResultId}`);
          }
        }, 3000);
      }
    } catch (err) {
      console.error('Lỗi khi nộp bài:', err);
    }
  };

  const handleFinish = () => {
    const totalQ = testSet?.totalQuestions || currentQuestions.length;
    if (Object.keys(answers).length < totalQ) {
      setIsSubmitWarningModalOpen(true);
    } else {
      executeFinish();
    }
  };

  const getOptionStatusClass = (optionId: string) => {
    if (mode === 'exam') {
      return selectedAnswer === optionId
        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
        : 'hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800 border-border/50 bg-background/50';
    }

    if (!isAnswered) {
      return selectedAnswer === optionId
        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
        : 'hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800 border-border/50 bg-background/50';
    }

    if (optionId === currentQuestion?.correctAnswer) {
      return 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)] scale-[1.02] transition-transform';
    }

    if (optionId === selectedAnswer && selectedAnswer !== currentQuestion?.correctAnswer) {
      return 'border-destructive bg-destructive/10 opacity-80';
    }

    return 'border-border/20 bg-background/30 opacity-50';
  };

  if (isTestSetLoading || isQuestionsLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pt-32 px-4">
        <Card className="p-12 text-center border-border/40 bg-secondary/10 shadow-sm rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Đang tải câu hỏi...</p>
        </Card>
      </div>
    );
  }

  if (currentQuestions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pt-32 px-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>
        <Card className="p-12 text-center border-border/40 bg-secondary/10 shadow-sm rounded-2xl">
          <p className="text-muted-foreground font-medium">
            Chưa có câu hỏi nào trong bộ từ vựng này.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-6 md:pt-24 px-3 md:px-4 pb-20">
      <div className="hidden md:flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            className="mb-4 text-muted-foreground -ml-4 hover:text-primary transition-colors"
            onClick={() => {
              if (Object.keys(answers).length > 0) {
                setIsBackModalOpen(true);
              } else {
                onBack();
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Button>
        </div>
        <div className="flex gap-3">
          {mode === 'practice' && (
            <div className="bg-secondary/40 backdrop-blur-md px-5 py-2.5 rounded-xl border border-border/50 text-sm font-medium shadow-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-primary font-bold text-base">{score}</span> đúng
            </div>
          )}
        </div>
      </div>

      {!isFinished ? (
        <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="absolute -top-4 left-0 right-0 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0F2356] to-[#1a3882] transition-all duration-500 ease-out"
              style={{
                width: `${(currentIndex / (testSet?.totalQuestions || 1)) * 100}%`,
              }}
            />
          </div>

          <Card className="overflow-hidden md:mt-0 mt-12 border-border/50 shadow-2xl shadow-primary/5 bg-gradient-to-b from-background to-secondary/10 backdrop-blur-xl rounded-2xl">
            <CardHeader className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-2 border-b border-border/10 bg-secondary/30 pb-4 pt-4 md:pb-6 md:pt-6">
              {passageContext ? (
                <div className="text-sm md:text-base font-medium text-foreground/90 whitespace-pre-wrap leading-relaxed w-full">
                  {passageContext}
                </div>
              ) : (
                <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Choose the correct answer
                </div>
              )}
            </CardHeader>

            <CardContent className="flex flex-col items-center relative p-2 md:p-6">
              <div className="text-center mb-2 md:mb-8 w-full">
                <div className="flex items-center justify-center gap-2 md:gap-3 mb-4">
                  {testSet?.category?.toLowerCase() === 'japanese' ||
                  testSet?.category?.toLowerCase() === 'jlpt' ? (
                    <h2
                      className="text-xl sm:text-2xl md:text-3xl leading-relaxed md:leading-relaxed font-bold text-slate-800 dark:text-slate-100 drop-shadow-sm px-2 md:px-4 [&_strong]:text-red-500 dark:[&_strong]:text-red-400 [&_strong]:underline [&_strong]:underline-offset-4 [&_rt]:text-[0.5em] [&_rt]:font-medium [&_rt]:text-muted-foreground/80"
                      dangerouslySetInnerHTML={{ __html: currentQuestion.word }}
                    />
                  ) : (
                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-800 dark:text-slate-100 tracking-tight drop-shadow-sm px-2 md:px-4">
                      {currentQuestion.word}
                    </h2>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full hover:bg-primary/10 text-muted-foreground transition-all"
                    onClick={() => {
                      const plainText =
                        testSet?.category?.toLowerCase() === 'japanese' ||
                        testSet?.category?.toLowerCase() === 'jlpt'
                          ? (currentQuestion.word || '').replace(/<[^>]*>?/gm, '')
                          : currentQuestion.word;
                      navigator.clipboard.writeText(plainText);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                  >
                    {isCopied ? (
                      <Check className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                {currentQuestion.pinyin && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge
                      variant="secondary"
                      className="text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-500/10 cursor-pointer transition-all hover:bg-teal-500/20 px-4 py-1.5"
                      onClick={() => setShowPinyin(!showPinyin)}
                    >
                      {showPinyin ? currentQuestion.pinyin : '***'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-teal-600 rounded-full"
                      onClick={() => setShowPinyin(!showPinyin)}
                    >
                      {showPinyin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>

              <div className="w-full grid grid-cols-2 gap-1 max-w-2xl mx-auto z-10">
                {currentQuestion.options.map((option: any) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelectAnswer(option.id)}
                    disabled={mode === 'practice' && isAnswered}
                    className={`relative p-2 rounded-2xl border-2 text-left transition-all duration-300 flex items-center justify-between group ${getOptionStatusClass(option.id)}`}
                  >
                    <div className="flex items-center gap-1">
                      <div className="flex shrink-0 items-center justify-center w-8 h-8 rounded-full border-2 border-current font-bold text-sm opacity-70 group-hover:opacity-100 transition-opacity">
                        {option.id}
                      </div>
                      <div>
                        <span className="font-semibold text-foreground/90 group-hover:text-foreground text-lg">
                          {option.value}
                        </span>
                        {option.pinyin && (
                          <span className="block text-sm text-muted-foreground mt-1">
                            {option.pinyin}
                          </span>
                        )}
                      </div>
                    </div>
                    {mode === 'practice' &&
                      isAnswered &&
                      option.id === currentQuestion.correctAnswer && (
                        <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 animate-in zoom-in" />
                      )}
                    {mode === 'practice' &&
                      isAnswered &&
                      selectedAnswer === option.id &&
                      selectedAnswer !== currentQuestion.correctAnswer && (
                        <XCircle className="w-6 h-6 text-destructive shrink-0 animate-in zoom-in" />
                      )}
                  </button>
                ))}
              </div>
            </CardContent>
            <div className="bg-card rounded-none border border-border/40 shadow-sm p-2 md:p-3 animate-in slide-in-from-bottom-4">
              <h3 className="font-bold text-foreground mb-4 md:flex hidden">Danh sách câu hỏi</h3>
              <div className="flex overflow-x-auto flex-nowrap justify-start gap-2 pb-2 snap-x">
                {currentQuestions.map((q: any, idx: number) => {
                  const isCurrent = idx === currentIndex;
                  const hasAnswer = !!answers[q.id];

                  let btnClass =
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent';
                  if (isCurrent) {
                    btnClass =
                      'ring-2 ring-primary ring-offset-background bg-primary/10 text-primary border-primary/20';
                  } else if (hasAnswer) {
                    btnClass =
                      'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 border-transparent';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        const ans = answers[q.id] || null;
                        setSelectedAnswer(ans);
                        setIsAnswered(mode === 'practice' ? !!ans : false);
                      }}
                      className={`w-9 h-9 shrink-0 m-1 rounded-full font-bold text-sm border flex items-center justify-center transition-all ${btnClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
                {hasNextPage && (
                  <button
                    onClick={() => fetchNextPage()}
                    className="w-10 h-10 shrink-0 rounded-xl font-bold text-sm border border-dashed border-primary/50 text-primary/70 flex items-center justify-center hover:bg-primary/5"
                    title="Tải thêm câu hỏi"
                  >
                    ...
                  </button>
                )}
              </div>
            </div>
            <CardFooter
              className={`bg-secondary/30 border-t border-border/10 flex flex-row items-center gap-2 px-2 py-2 md:px-8 md:py-6 justify-between`}
            >
              <Button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                variant="outline"
                size="lg"
                className="gap-2 rounded-xl font-bold w-16 sm:w-44 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Câu trước</span>
              </Button>
              {mode === 'practice' && currentQuestion.explanation && (
                <div
                  className={`w-full max-w-2xl mx-auto z-10 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-xl text-sm border border-blue-200 dark:border-blue-800 transition-all duration-300 ${
                    isAnswered ? 'opacity-100' : 'opacity-0 invisible'
                  }`}
                >
                  <span className="font-bold block mb-1">Giải thích:</span>
                  <div className="whitespace-pre-wrap">{currentQuestion.explanation}</div>
                </div>
              )}
              <Button
                onClick={handleNext}
                // disabled={mode === 'practice' ? !isAnswered : false}
                size="lg"
                className="gap-2 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 font-bold w-16 sm:w-44 shrink-0"
              >
                <span className="hidden sm:inline">
                  {currentIndex === currentQuestions.length - 1 ? 'Hoàn thành' : 'Câu tiếp theo'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-8 pt-32 px-4">
          <Card className="p-12 text-center border-border/40 bg-secondary/10 shadow-sm rounded-2xl animate-in fade-in duration-500">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-6" />
            <p className="text-xl text-primary font-bold">Đang nộp bài...</p>
            <p className="text-muted-foreground mt-2">
              Vui lòng đợi trong giây lát để xem kết quả chi tiết.
            </p>
          </Card>
        </div>
      )}

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
        description={`Bạn mới hoàn thành ${Object.keys(answers).length}/${testSet?.totalQuestions || currentQuestions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài lúc này không?`}
        confirmText="Nộp bài luôn"
        cancelText="Quay lại làm tiếp"
        variant="default"
      />
    </div>
  );
}
