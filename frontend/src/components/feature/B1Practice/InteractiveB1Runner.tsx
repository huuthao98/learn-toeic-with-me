import {
  Mic,
  Pause,
  PenTool,
  BookOpen,
  PlayIcon,
  ArrowLeft,
  ArrowRight,
  Headphones,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useRef } from 'react';

import { B1Question } from '@/api/b1';
import { useB1 } from '@/hooks/useB1';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface InteractiveB1RunnerProps {
  testSetId: string;
  onBack: () => void;
  questions: B1Question[];
  isExamMode: boolean;
  testAudioUrl: string;
}

export function InteractiveB1Runner({
  testSetId,
  onBack,
  questions,
  isExamMode,
  testAudioUrl,
}: InteractiveB1RunnerProps) {
  const router = useRouter();
  const { useSubmitExamMutation } = useB1();
  const submitExamMutation = useSubmitExamMutation();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const groups = useMemo(() => {
    const sortedQuestions = [...questions].sort((a, b) => {
      const skillsOrder = { listening: 1, reading: 2, writing: 3, speaking: 4 };
      if (skillsOrder[a.skill] !== skillsOrder[b.skill]) {
        return skillsOrder[a.skill] - skillsOrder[b.skill];
      }
      return (a.questionNumber || 0) - (b.questionNumber || 0);
    });

    const grouped = sortedQuestions.reduce<
      Record<
        string,
        {
          key: string;
          skill: string;
          passageContext?: string;
          passageType?: string;
          questions: B1Question[];
        }
      >
    >((acc, q) => {
      const key = q.setId ? `${q.skill}_set_${q.setId}` : `single_${q._id}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          skill: q.skill,
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
  const [audioPlaying, setAudioPlaying] = useState(false);

  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  const timePerQuestion = useMemo(
    () => new Array(questions.length).fill(10000), // Mocks time tracking for now
    [questions.length],
  );

  const [isFinished, setIsFinished] = useState(false);
  const [isBackModalOpen, setIsBackModalOpen] = useState(false);
  const [isSubmitWarningModalOpen, setIsSubmitWarningModalOpen] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentGroup = groups[currentGroupIndex] || groups[0];
  const safeQuestionIndex = Math.min(
    currentQuestionIndex,
    Math.max(0, (currentGroup?.questions.length || 1) - 1),
  );
  const currentQuestion = currentGroup?.questions[safeQuestionIndex];

  const handleAnswerSelect = (qId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const handleFinishRequest = () => {
    // Determine if user has attempted enough questions
    // For B1, writing and speaking might not be easily 'checked' for completeness if they are empty
    setIsSubmitWarningModalOpen(true);
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupIndex, safeQuestionIndex, groups.length]);

  const executeFinish = async () => {
    setIsFinished(true);
    try {
      const res = await submitExamMutation.mutateAsync({
        setId: testSetId,
        answers,
        timePerQuestion,
        isTest: isExamMode,
      });

      if (res) {
        if (res.totalEarned > 0) {
          toast.success(`🎉 Chúc mừng! Bạn nhận được ${res.totalEarned} XP!`, {
            duration: 5000,
          });
        }

        setTimeout(() => {
          if (res.resultId) {
            // Logged-in user: redirect với resultId từ server
            router.push(`/exam-b1/${testSetId}/results?resultId=${res.resultId}`);
          } else {
            // Guest mode: lưu kết quả vào sessionStorage rồi redirect với localResultId
            const localResultId = `b1_result_${Date.now()}`;
            sessionStorage.setItem(localResultId, JSON.stringify(res));
            router.push(`/exam-b1/${testSetId}/results?localResultId=${localResultId}`);
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Lỗi khi nộp bài:', err);
      toast.error('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
      setIsFinished(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const loaded = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', loaded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', loaded);
    };
  }, []);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setAudioPlaying(true);
    } else {
      audio.pause();
      setAudioPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = Number(e.target.value);
  };

  if (!currentGroup || !currentQuestion) return null;

  const selectedAnswer = answers[currentQuestion._id];
  const isCurrentAnswered = !!selectedAnswer || currentQuestion.questionType === 'speaking';

  const SkillIcon =
    {
      listening: Headphones,
      reading: BookOpen,
      writing: PenTool,
      speaking: Mic,
    }[currentGroup.skill] || BookOpen;

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 pt-2 pb-24">
      <div className="flex flex-wrap items-center gap-2 justify-between bg-background/80 backdrop-blur-md sticky top-0 z-40 py-2 mb-2">
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="destructive"
            className="text-muted-foreground hover:text-primary transition-colors"
            onClick={() => {
              if (Object.keys(answers).length > 0) setIsBackModalOpen(true);
              else onBack();
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Thoát
          </Button>
          <Badge
            variant="outline"
            className="text-sm px-3 py-1 bg-background capitalize flex items-center gap-2"
          >
            <SkillIcon className="w-4 h-4 text-primary" />
            {currentGroup.skill}
          </Badge>
        </div>
        {currentGroup.skill === 'listening' && testAudioUrl && (
          <div className="order-last sm:order-none w-full sm:w-auto sm:flex-1 min-w-0 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5">
            <audio
              ref={audioRef}
              src={testAudioUrl}
              className="hidden"
              onEnded={() => setAudioPlaying(false)}
            />
            <Button size="icon" className="rounded-full shrink-0 w-8 h-8" onClick={toggleAudio}>
              {audioPlaying ? <Pause size={16} /> : <PlayIcon size={16} />}
            </Button>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 min-w-0"
            />
            <span className="text-xs shrink-0 w-14 text-right tabular-nums">
              {Math.floor(currentTime / 60)}:
              {Math.floor(currentTime % 60)
                .toString()
                .padStart(2, '0')}
            </span>
          </div>
        )}

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                className="relative h-10 px-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/5 hover:from-primary/20 hover:to-primary/10 backdrop-blur-md text-sm font-semibold shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex items-center gap-2.5 overflow-hidden group"
              />
            }
          >
            <span className="flex items-center gap-2 relative z-10">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs">
                {Object.keys(answers).length}
              </span>
              <span className="text-foreground/80 group-hover:text-foreground transition-colors">
                / {questions.length} câu
              </span>
              <span className="hidden sm:inline text-muted-foreground text-xs font-normal">
                đã làm
              </span>
            </span>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-80 sm:w-96 overflow-y-auto custom-scrollbar flex flex-col gap-1"
          >
            <SheetHeader className="shrink-0">
              <SheetTitle>Danh sách câu hỏi</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-6">
              {['listening', 'reading', 'writing', 'speaking'].map(skill => {
                const skillQuestions = questions.filter(q => q.skill === skill);
                if (skillQuestions.length === 0) return null;

                return (
                  <div key={skill} className="space-y-4">
                    <h3 className="capitalize font-bold text-base text-primary/90 border-b border-primary/20 pb-1.5 flex items-center gap-2">
                      {skill}
                    </h3>
                    <div className="space-y-5">
                      {[1, 2, 3, 4, 5, 6, 7].map(partNum => {
                        const partQuestions = skillQuestions.filter(
                          q => String(q.part) === String(partNum),
                        );
                        if (partQuestions.length === 0) return null;

                        const answeredPartCount = partQuestions.filter(
                          q => !!answers[q._id],
                        ).length;

                        return (
                          <div key={partNum} className="space-y-3 pl-3 border-l-2 border-muted/60">
                            <div className="flex items-center justify-between pb-1">
                              <h4 className="font-semibold text-sm text-foreground/90">
                                Part {partNum}
                              </h4>
                              <span className="text-xs font-medium text-muted-foreground">
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
                                    ? groups[gIndex].questions.findIndex(gq => gq._id === q._id)
                                    : -1;
                                const isCurrent =
                                  gIndex === currentGroupIndex && qIndex === safeQuestionIndex;

                                return (
                                  <Button
                                    key={q._id}
                                    variant={isAnswered ? 'default' : 'outline'}
                                    className={`h-10 w-full p-0 text-xs font-semibold transition-all ${
                                      isAnswered
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-foreground hover:border-primary/50'
                                    } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                                    onClick={() => {
                                      if (gIndex !== -1) {
                                        setCurrentGroupIndex(gIndex);
                                        setCurrentQuestionIndex(qIndex !== -1 ? qIndex : 0);
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
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center px-4 py-2">
              <Button
                variant="default"
                className="shadow-sm font-semibold hover:scale-105 transition-transform"
                onClick={handleFinishRequest}
                disabled={isFinished}
              >
                Nộp bài ngay
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col gap-6 relative">
        {/* Listening: passageContext (Part 2/3) hiển thị chung cho nhóm câu cùng setId */}
        {currentGroup.skill === 'listening' && currentGroup.passageContext && (
          <Card className="shadow-md border-primary/10 bg-secondary/10">
            <CardContent className="p-5">
              <div
                className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-serif [&_strong]:font-bold [&_b]:font-bold"
                dangerouslySetInnerHTML={{ __html: currentGroup.passageContext }}
              />
            </CardContent>
          </Card>
        )}

        {currentGroup.skill === 'reading' && currentGroup.passageContext && (
          <Card className="shadow-lg border-primary/10 bg-secondary/10">
            <CardContent className="p-6">
              <div
                className="text-sm md:text-base leading-relaxed text-foreground whitespace-pre-wrap font-serif [&_strong]:font-bold [&_b]:font-bold"
                dangerouslySetInnerHTML={{ __html: currentGroup.passageContext }}
              />
            </CardContent>
          </Card>
        )}

        {/* Writing: hiển thị đề bài / ngữ cảnh */}
        {currentGroup.skill === 'writing' && currentGroup.passageContext && (
          <Card className="shadow-md border-primary/10 bg-secondary/10">
            <CardContent className="p-5">
              <h3 className="font-semibold text-base text-primary mb-3 flex items-center gap-2">
                <PenTool className="w-4 h-4" /> Ngữ cảnh / Đề bài
              </h3>
              <div
                className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-serif [&_strong]:font-bold [&_b]:font-bold"
                dangerouslySetInnerHTML={{ __html: currentGroup.passageContext }}
              />
            </CardContent>
          </Card>
        )}

        {/* Speaking: hiển thị chủ đề / hướng dẫn */}
        {currentGroup.skill === 'speaking' && currentGroup.passageContext && (
          <Card className="shadow-md border-primary/10 bg-secondary/10">
            <CardContent className="p-5">
              <div
                className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-serif [&_strong]:font-bold [&_b]:font-bold"
                dangerouslySetInnerHTML={{ __html: currentGroup.passageContext }}
              />
            </CardContent>
          </Card>
        )}

        {currentGroup.skill !== 'speaking' && currentGroup.skill !== 'writing' && (
          <div
            className={`space-y-6 ${
              currentGroup.passageContext && currentGroup.skill === 'reading'
                ? 'lg:col-span-5'
                : currentGroup.skill === 'listening' && currentGroup.questions.length > 1
                  ? 'w-full'
                  : 'lg:col-span-12 max-w-2xl mx-auto w-full'
            }`}
          >
            {/* Listening Part 2/3: hiển thị tất cả câu cùng setId cùng lúc */}
            {currentGroup.skill === 'listening' && currentGroup.questions.length > 1 ? (
              <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                {currentGroup.questions.map(q => {
                  const qAnswer = answers[q._id];
                  return (
                    <Card key={q._id} className="shadow-md border-t-4 border-t-primary h-full">
                      <CardContent className="p-2">
                        <div className="mb-4 flex flex-start gap-2">
                          <h2 className="text-sm font-bold text-foreground whitespace-nowrap h-full items-start">
                            {q.questionNumber ? `Câu ${q.questionNumber}` : 'Câu hỏi'}.
                          </h2>
                          {q.questionText && (
                            <p className="text-sm font-medium text-foreground leading-relaxed">
                              {q.questionText}
                            </p>
                          )}
                        </div>

                        {q.questionType === 'multiple_choice' && q.options && (
                          <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                            {q.options.map((opt, index) => {
                              const isSelected = qAnswer === opt.label;
                              const isCorrect =
                                !isExamMode && qAnswer && q.correctAnswer === opt.label;
                              const isWrong =
                                !isExamMode && isSelected && q.correctAnswer !== opt.label;
                              return (
                                <button
                                  key={q._id + index}
                                  onClick={() => handleAnswerSelect(q._id, opt.label)}
                                  className={`
                                    w-full text-left p-2 sm:p-3 rounded-xl border-1 transition-all duration-200 flex items-center gap-2 sm:gap-4 group
                                    ${
                                      isCorrect
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm dark:bg-emerald-500/10'
                                        : isWrong
                                          ? 'border-red-500 bg-red-50 text-red-900 shadow-sm dark:bg-red-500/10'
                                          : isSelected
                                            ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                            : 'border-border/60 hover:border-primary/40 bg-background hover:bg-secondary/50'
                                    }
                                  `}
                                >
                                  <div
                                    className={`
                                      flex items-center justify-center w-8 h-8 rounded-full font-bold shrink-0 transition-colors
                                      ${
                                        isCorrect
                                          ? 'bg-emerald-500 text-white'
                                          : isWrong
                                            ? 'bg-red-500 text-white'
                                            : isSelected
                                              ? 'bg-primary text-primary-foreground'
                                              : 'bg-secondary text-secondary-foreground group-hover:bg-primary/20'
                                      }
                                    `}
                                  >
                                    {opt.label}
                                  </div>
                                  <span className="text-sm font-medium flex-1">{opt.text}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {!isExamMode &&
                          qAnswer &&
                          q.explanation &&
                          q.questionType === 'multiple_choice' && (
                            <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 animate-in fade-in slide-in-from-top-2">
                              <h4 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4" /> Giải thích:
                              </h4>
                              <p className="text-blue-800 dark:text-blue-400 text-sm leading-relaxed">
                                {q.explanation}
                              </p>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* Listening Part 1 / các skill khác: hiển thị 1 câu tại một thời điểm */
              <Card className="shadow-lg border-t-4 border-t-primary">
                <CardContent className="p-3">
                  {currentGroup.skill !== 'speaking' && (
                    <div className="mb-6 flex flex-start gap-2">
                      <h2 className="text-xl font-bold text-foreground whitespace-nowrap h-full items-start">
                        {currentQuestion.questionNumber
                          ? `Câu ${currentQuestion.questionNumber}`
                          : 'Câu hỏi'}
                        .
                      </h2>
                      {currentQuestion.questionText && (
                        <p 
                          className="text-lg font-medium text-foreground leading-relaxed [&_strong]:font-bold [&_b]:font-bold"
                          dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }}
                        />
                      )}
                    </div>
                  )}

                  {currentQuestion.questionType === 'multiple_choice' &&
                    currentQuestion.options && (
                      <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                        {currentQuestion.options.map((opt, index) => {
                          const isSelected = selectedAnswer === opt.label;
                          const isCorrect =
                            !isExamMode &&
                            selectedAnswer &&
                            currentQuestion.correctAnswer === opt.label;
                          const isWrong =
                            !isExamMode &&
                            isSelected &&
                            currentQuestion.correctAnswer !== opt.label;

                          return (
                            <button
                              key={index}
                              onClick={() => handleAnswerSelect(currentQuestion._id, opt.label)}
                              className={`
                            w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 sm:gap-4 group
                            ${
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm dark:bg-emerald-500/10'
                                : isWrong
                                  ? 'border-red-500 bg-red-50 text-red-900 shadow-sm dark:bg-red-500/10'
                                  : isSelected
                                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                    : 'border-border/60 hover:border-primary/40 bg-background hover:bg-secondary/50'
                            }
                          `}
                            >
                              <div
                                className={`
                               flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 transition-colors
                               ${
                                 isCorrect
                                   ? 'bg-emerald-500 text-white'
                                   : isWrong
                                     ? 'bg-red-500 text-white'
                                     : isSelected
                                       ? 'bg-primary text-primary-foreground'
                                       : 'bg-secondary text-secondary-foreground group-hover:bg-primary/20'
                               }
                             `}
                              >
                                {opt.label}
                              </div>
                              <span className="text-base font-medium flex-1">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {/* {currentQuestion.questionType === 'essay' && (
                    <div className="space-y-4 mt-4">
                      <Textarea
                        placeholder="Gõ bài làm của bạn ở đây..."
                        className="min-h-[250px] resize-y text-base p-4"
                        value={selectedAnswer || ''}
                        onChange={(e: any) =>
                          handleAnswerSelect(currentQuestion._id, e.target.value)
                        }
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        Số từ: {selectedAnswer ? selectedAnswer.trim().split(/\s+/).length : 0}
                      </p>
                    </div>
                  )} */}

                  {!isExamMode &&
                    selectedAnswer &&
                    currentQuestion.explanation &&
                    currentQuestion.questionType === 'multiple_choice' && (
                      <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4" /> Giải thích chi tiết:
                        </h4>
                        <p className="text-blue-800 dark:text-blue-400 text-sm leading-relaxed">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-2 sm:p-4 z-50">
        <div className="max-w-4xl mx-auto flex flex-nowrap items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrev}
            disabled={currentGroupIndex === 0 && safeQuestionIndex === 0}
            className="shrink-0 px-4 sm:px-8 sm:w-[120px] order-1"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" />{' '}
            <span className="hidden sm:inline">Trước</span>
          </Button>

          {/* Danh sách câu hỏi khi cùng setId */}
          <div className="flex-1 min-w-0 order-2 flex justify-center overflow-hidden">
            {currentGroup.questions.length > 1 ? (
              <div className="flex items-center gap-1 flex-nowrap overflow-x-auto custom-scrollbar justify-start sm:justify-center py-2 px-1 w-full max-w-full">
                {currentGroup.questions.map((q, idx) => {
                  const isCurrentQ = idx === safeQuestionIndex;
                  const isAnswered = !!answers[q._id];
                  return (
                    <button
                      key={q._id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-9 w-9 rounded-full text-xs font-bold border-2 transition-all shrink-0 ${
                        isCurrentQ
                          ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary'
                          : isAnswered
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-background border-border hover:border-primary/50 text-foreground'
                      }`}
                    >
                      {q.questionNumber || idx + 1}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="text-sm font-semibold text-primary-foreground bg-primary px-3 py-1 rounded-full my-auto mx-auto shrink-0">
                {currentQuestion.questionNumber ? `Câu ${currentQuestion.questionNumber}` : ''}
              </span>
            )}
          </div>

          <Button
            size="lg"
            onClick={handleNext}
            className={`shrink-0 px-4 sm:px-8 sm:w-[140px] shadow-md transition-all order-3 ${
              !isCurrentAnswered && currentQuestion.questionType !== 'speaking'
                ? 'opacity-80'
                : 'hover:scale-105'
            }`}
          >
            {currentGroupIndex === groups.length - 1 &&
            safeQuestionIndex === (currentGroup?.questions.length || 1) - 1 ? (
              <span className="flex items-center justify-center">
                <span className="hidden sm:inline">Hoàn thành</span>{' '}
                <CheckCircle className="w-5 h-5 sm:w-4 sm:h-4 sm:ml-2" />
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span className="hidden sm:inline">Tiếp theo</span>{' '}
                <ArrowRight className="w-5 h-5 sm:w-4 sm:h-4 sm:ml-2" />
              </span>
            )}
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isBackModalOpen}
        onClose={() => setIsBackModalOpen(false)}
        onConfirm={onBack}
        title="Bạn chắc chắn muốn thoát?"
        description="Kết quả đang làm sẽ không được lưu lại nếu bạn thoát ngay bây giờ."
        confirmText="Vẫn thoát"
        cancelText="Ở lại làm tiếp"
      />

      <ConfirmModal
        isOpen={isSubmitWarningModalOpen}
        onClose={() => setIsSubmitWarningModalOpen(false)}
        onConfirm={() => {
          setIsSubmitWarningModalOpen(false);
          executeFinish();
        }}
        title="Xác nhận nộp bài?"
        description="Bạn chắc chắn muốn nộp bài? Hãy chắc chắn rằng bạn đã làm đủ các câu hỏi."
        confirmText="Nộp bài luôn"
        cancelText="Kiểm tra lại"
      />
    </div>
  );
}
