'use client';

import {
  Send,
  Clock,
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import { useTests, Question } from '@/hooks/useTests';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import { ListeningInstructions } from '@/components/ListeningInstructions';

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testSetId = params.id as string;

  const { useTestSet, useTestQuestions, useSubmitExamMutation } = useTests();
  const { data: testSet, isLoading: loadingSet } = useTestSet(testSetId);
  const { data: questions, isLoading: loadingQuestions } = useTestQuestions(testSetId);
  const submitExamMutation = useSubmitExamMutation(testSetId);

  // Answers state: { questionId: selectedOption }
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [copied, setCopied] = useState(false);
  const [copiedOpt, setCopiedOpt] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedOpt(label);
        setTimeout(() => setCopiedOpt(null), 2000);
      })
      .catch((err) => {
        console.error('Không thể sao chép: ', err);
      });
  };

  const handleCopyQuestion = () => {
    if (!questions) return;
    const cQ = questions[activeQuestionIndex];
    if (!cQ) return;

    let groupPassageText = cQ.passage_text;
    if (!groupPassageText && cQ.group_id) {
      const gQ = questions.find((q: any) => q.group_id === cQ.group_id && q.passage_text);
      if (gQ) groupPassageText = gQ.passage_text;
    }

    let textToCopy = '';
    if (groupPassageText) {
      textToCopy += `[Đoạn văn]\n${groupPassageText}\n\n`;
    }
    if (cQ.question_text) {
      textToCopy += `[Câu hỏi]\n${cQ.question_text}\n\n`;
    }

    if (cQ.options && cQ.options.length > 0) {
      textToCopy += `[Lựa chọn]\n`;
      cQ.options.forEach((opt: any) => {
        textToCopy += `${opt.label}. ${opt.text}\n`;
      });
    }

    navigator.clipboard
      .writeText(textToCopy.trim())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Không thể sao chép: ', err);
      });
  };

  // Initialize countdown timer (2 hours = 7200 seconds)
  useEffect(() => {
    if (questions && questions.length > 0) {
      const isListeningFirst = questions[0]?.part === '1';
      setShowInstructions(isListeningFirst);
      setTimeLeft(7200);
    }
  }, [questions]);

  // Auto-play audio if navigated with ?autoplay=true
  useEffect(() => {
    if (testSet?.audioUrl && searchParams.get('autoplay') === 'true') {
      const timer = setTimeout(() => {
        const audio = document.getElementById('global-audio-player') as HTMLAudioElement;
        if (audio) {
          audio.play().catch((err) => {
            console.warn('Autoplay prevented by browser policy. User must interact first.');
          });
          // Remove ?autoplay=true from URL so refreshing the page doesn't try to play again
          router.replace(`/practice/${testSetId}`, { scroll: false });
        }
      }, 500); // Give the DOM a tiny bit of time to render the audio player
      return () => clearTimeout(timer);
    }
  }, [testSet?.audioUrl, searchParams, router, testSetId]);

  // Timer interval
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Select Option
  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  // Calculate duration
  const getDurationMinutes = () => {
    const end = Date.now();
    const diff = end - startTime;
    return Math.max(Math.round(diff / 60000), 1);
  };

  // Submit Exam
  const handleSubmitExam = () => {
    setIsSubmitDialogOpen(false);
    submitExamMutation.mutate(
      {
        answers,
        durationMinutes: getDurationMinutes(),
      },
      {
        onSuccess: (data) => {
          // Save answers to localStorage for review on results page
          localStorage.setItem(`toeic-test-answers-${data.resultId}`, JSON.stringify(answers));
          // Redirect to results page, passing the newly created TestResult ID
          router.push(`/practice/${testSetId}/results?resultId=${data.resultId}`);
        },
      },
    );
  };

  // Format Timer Text
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loadingSet || loadingQuestions) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-semibold">Đang chuẩn bị đề thi...</p>
        </div>
      </div>
    );
  }

  if (!testSet || !questions || questions.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
        <HelpCircle className="h-12 w-12 text-muted-foreground" />
        <h4 className="text-lg font-bold">Không tìm thấy đề thi</h4>
        <Button onClick={() => router.push('/practice')}>Quay lại thư viện</Button>
      </div>
    );
  }

  const currentQuestion = questions[activeQuestionIndex];
  const answeredCount = Object.keys(answers).length;

  // Index of the first Part 2 question
  const firstPart2Index = questions.findIndex((q) => q.part === '2');
  // Index of the first Part 3 question
  const firstPart3Index = questions.findIndex((q) => q.part === '3');
  // Index of the first Part 4 question
  const firstPart4Index = questions.findIndex((q) => q.part === '4');
  // Index of the first Part 5 question
  const firstPart5Index = questions.findIndex((q) => q.part === '5');
  // Index of the first Part 6 question
  const firstPart6Index = questions.findIndex((q) => q.part === '6');
  // Index of the first Part 7 question
  const firstPart7Index = questions.findIndex((q) => q.part === '7');

  const getPartLabel = (part: string) => {
    switch (part) {
      case '1':
        return 'Photos (Tranh tả cảnh)';
      case '2':
        return 'Question-Response (Hỏi & Đáp)';
      case '3':
        return 'Conversations (Hội thoại)';
      case '4':
        return 'Talks (Bài nói ngắn)';
      case '5':
        return 'Incomplete Sentences (Điền câu)';
      case '6':
        return 'Text Completion (Điền đoạn văn)';
      case '7':
        return 'Reading Comprehension (Đọc hiểu)';
      default:
        return 'Practice Test';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Exam Top Header (Fixed) */}
      <div className="glass-panel border-b border-border/40 h-16 sticky top-0 z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Tiến trình thi sẽ bị hủy. Bạn có muốn thoát?')) {
                router.push('/practice');
              }
            }}
            className="p-2 rounded-lg bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h3 className="font-bold text-sm truncate max-w-xs sm:max-w-md">{testSet.name}</h3>
            <p className="text-[10px] text-muted-foreground">TOEIC Practice Test</p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary animate-pulse-ring">
          <Clock className="h-4 w-4" />
          <span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
        </div>

        {/* Action Buttons */}
        <div className="p-2 border-t border-border/40">
          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogTrigger className="p-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-bold transition-all duration-200 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 w-full py-2.5 cursor-pointer">
              <Send className="h-4 w-4" />
              <span>Nộp bài thi</span>
            </DialogTrigger>
            <DialogContent className="glass-panel">
              <DialogHeader>
                <DialogTitle>Xác nhận nộp bài thi?</DialogTitle>
                <DialogDescription>
                  Bạn đã làm {answeredCount} trên tổng số {questions.length} câu hỏi. Bạn có chắc
                  chắn muốn nộp bài để xem điểm số?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button variant="ghost" onClick={() => setIsSubmitDialogOpen(false)}>
                  Làm tiếp
                </Button>
                <Button onClick={handleSubmitExam} disabled={submitExamMutation.isPending}>
                  {submitExamMutation.isPending ? 'Đang chấm điểm...' : 'Nộp bài'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Global Audio Player for the entire Test Set */}
      {testSet.audioUrl && (
        <div className="bg-secondary/20 border-b border-border/40 px-4 py-3 flex justify-center sticky top-16 z-20 backdrop-blur-md">
          <audio
            id="global-audio-player"
            src={testSet.audioUrl}
            controls
            className="w-full max-w-2xl h-10 shadow-sm rounded-full"
          />
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 p-2 md:p-4 max-w-7xl w-full mx-auto grid gap-2 lg:grid-cols-12 items-start">
        {/* Left column: Active Question Display */}
        <div
          className={`space-y-6 h-full justify-center ${showInstructions ? 'lg:col-span-12' : 'lg:col-span-9'}`}
        >
          {/* TOEIC-style Instruction Panel — shown only on Question 1 Part 1 */}
          {showInstructions && activeQuestionIndex === 0 && currentQuestion.part === '1' ? (
            <ListeningInstructions onStart={() => setShowInstructions(false)} />
          ) : (
            <>
              <Card className="glass-card border-l-4 border-l-primary h-full justify-start">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-primary">
                      Câu hỏi {activeQuestionIndex + 1} / {questions.length}
                    </span>
                    <CardDescription className="text-xs mt-0.5">
                      Độ khó: {currentQuestion.difficulty}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-bold">
                      {getPartLabel(currentQuestion.part)}
                    </span>

                    {/* Copy Button */}
                    <button
                      onClick={handleCopyQuestion}
                      className="p-1.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 text-[10px] font-bold border border-border/20 shadow-xs cursor-pointer active:scale-95 animate-fade-in"
                      title="Sao chép câu hỏi để mang đi dịch"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                          <span className="text-emerald-500">Đã chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {testSet.testType === 'interview' ? (
                    <div className="space-y-5 flex flex-col">
                      <div className="text-base font-semibold leading-relaxed p-4 rounded-xl bg-secondary/30 border border-border/20 text-indigo-900 dark:text-indigo-200">
                        {currentQuestion.category && (
                          <span className="text-xs font-bold text-primary mr-2 uppercase tracking-wider">
                            [{currentQuestion.category}]
                          </span>
                        )}
                        {currentQuestion.question_text}
                      </div>
                      <div className="space-y-3">
                        <textarea
                          value={answers[currentQuestion._id] || ''}
                          onChange={(e) => handleSelectOption(currentQuestion._id, e.target.value)}
                          placeholder="Nhập câu trả lời của bạn vào đây..."
                          className="w-full min-h-[200px] p-4 rounded-xl border border-border/40 bg-background resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  ) : ['3', '4', '6', '7'].includes(currentQuestion.part) ? (
                    <div className="flex flex-col gap-5">
                      {/* Shared Passage / Media */}
                      <div className="space-y-4 p-4 rounded-xl bg-secondary/20 border border-border/30 max-h-[380px] overflow-y-auto w-full">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-primary/10 text-primary rounded w-fit block">
                          {['6', '7'].includes(currentQuestion.part)
                            ? 'Đoạn văn đọc'
                            : 'Tập tin âm thanh'}
                        </span>

                        {/* Group Audio Player (Part 3, 4) */}
                        {(() => {
                          let audioUrl = currentQuestion.audio_url;
                          if (!audioUrl && currentQuestion.group_id) {
                            const gQ = questions.find(
                              (q: any) => q.group_id === currentQuestion.group_id && q.audio_url,
                            );
                            if (gQ) audioUrl = gQ.audio_url;
                          }
                          return (
                            (currentQuestion.part === '3' || currentQuestion.part === '4') &&
                            audioUrl && (
                              <div className="space-y-1.5">
                                <audio src={audioUrl} controls className="w-full" />
                              </div>
                            )
                          );
                        })()}

                        {/* Group Diagram Image (Part 3, 4, 7) */}
                        {(() => {
                          let imageUrl = currentQuestion.image_url;
                          if (!imageUrl && currentQuestion.group_id) {
                            const gQ = questions.find(
                              (q: any) => q.group_id === currentQuestion.group_id && q.image_url,
                            );
                            if (gQ) imageUrl = gQ.image_url;
                          }
                          return (
                            imageUrl && (
                              <div className="flex justify-center bg-background/50 rounded-lg p-2 border border-border/20">
                                <img
                                  src={imageUrl}
                                  alt="Diagram"
                                  className="max-h-44 object-contain rounded"
                                />
                              </div>
                            )
                          );
                        })()}

                        {/* Group Passage Text (Part 6, 7) */}
                        {(() => {
                          let passageText = currentQuestion.passage_text;
                          if (!passageText && currentQuestion.group_id) {
                            const gQ = questions.find(
                              (q: any) => q.group_id === currentQuestion.group_id && q.passage_text,
                            );
                            if (gQ) passageText = gQ.passage_text;
                          }
                          return (
                            passageText && (
                              <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line font-serif pr-2">
                                {passageText}
                              </div>
                            )
                          );
                        })()}
                      </div>

                      {/* Question Form Area below */}
                      <div className="space-y-4 w-full">
                        {currentQuestion.question_text && (
                          <div className="text-sm font-semibold leading-relaxed p-3.5 rounded-xl bg-secondary/35 border border-border/20 text-indigo-900 dark:text-indigo-200">
                            {currentQuestion.question_text}
                          </div>
                        )}

                        {/* Options list in 2 columns */}
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                          {currentQuestion.options.map((opt) => {
                            const isSelected = answers[currentQuestion._id] === opt.label;
                            return (
                              <button
                                key={opt.label}
                                onClick={() => handleSelectOption(currentQuestion._id, opt.label)}
                                className={`relative group/opt flex items-center gap-3 w-full p-3 pr-10 rounded-xl border text-left transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary/5 text-primary shadow-sm font-semibold'
                                    : 'border-border/40 hover:bg-secondary/40 hover:border-border text-foreground'
                                }`}
                              >
                                <span
                                  className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground shadow-sm'
                                      : 'bg-secondary text-muted-foreground'
                                  }`}
                                >
                                  {opt.label}
                                </span>
                                <span className="text-xs mr-2">{opt.text}</span>

                                {/* Copy option button */}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleCopyText(opt.text, opt.label);
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground opacity-0 group-hover/opt:opacity-100 transition-all cursor-pointer z-20 active:scale-95"
                                  title={`Sao chép lựa chọn ${opt.label}`}
                                >
                                  {copiedOpt === opt.label ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Non-split parts (Part 1, 2, 5) */
                    <div className="space-y-5 flex flex-col ">
                      {/* Part 1: Image display */}
                      {currentQuestion.part === '1' && currentQuestion.image_url && (
                        <div className="flex justify-center bg-secondary/10 rounded-xl p-3 border border-border/20">
                          <img
                            src={currentQuestion.image_url}
                            alt="Part 1 Photo"
                            className="max-h-64 object-contain rounded-lg shadow-sm"
                          />
                        </div>
                      )}

                      {/* Part 2: Per-question audio (nếu có) */}
                      {currentQuestion.part === '2' && currentQuestion.audio_url && (
                        <div className="flex justify-center p-4 bg-secondary/10 rounded-xl border border-border/10">
                          <audio
                            src={currentQuestion.audio_url}
                            controls
                            className="w-full max-w-md"
                          />
                        </div>
                      )}

                      {/* Question Text for Part 5 */}
                      {currentQuestion.question_text && (
                        <div className="text-base font-semibold leading-relaxed p-4 rounded-xl bg-secondary/30 border border-border/20 text-indigo-900 dark:text-indigo-200">
                          {currentQuestion.question_text}
                        </div>
                      )}

                      {/* Options */}
                      <div className="space-y-3">
                        {currentQuestion.options.map((opt) => {
                          const isSelected = answers[currentQuestion._id] === opt.label;
                          return (
                            <button
                              key={opt.label}
                              onClick={() => handleSelectOption(currentQuestion._id, opt.label)}
                              className={`relative group/opt flex items-center gap-4 w-full p-4 pr-10 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/5 text-primary shadow-sm font-semibold'
                                  : 'border-border/40 hover:bg-secondary/40 hover:border-border text-foreground'
                              }`}
                            >
                              <span
                                className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-secondary text-muted-foreground'
                                }`}
                              >
                                {opt.label}
                              </span>
                              <span className="text-sm mr-2">{opt.text}</span>

                              {/* Copy option button */}
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleCopyText(opt.text, opt.label);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground opacity-0 group-hover/opt:opacity-100 transition-all cursor-pointer z-20 active:scale-95"
                                title={`Sao chép lựa chọn ${opt.label}`}
                              >
                                {copiedOpt === opt.label ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>

                {/* Question footer navigator */}
                <CardFooter className="flex justify-between border-t border-border/40 pt-4">
                  <Button
                    variant="outline"
                    disabled={activeQuestionIndex === 0 && currentQuestion.part !== '1'}
                    onClick={() => {
                      if (activeQuestionIndex === 0) {
                        setShowInstructions(true);
                      } else {
                        setActiveQuestionIndex(activeQuestionIndex - 1);
                      }
                    }}
                    className="text-xs"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span>
                      {activeQuestionIndex === 0 && currentQuestion.part === '1'
                        ? 'Quay lại'
                        : 'Câu trước'}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    disabled={activeQuestionIndex === questions.length - 1}
                    onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
                    className="text-xs"
                  >
                    <span>Câu sau</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </div>

        {!showInstructions && (
          <div className="lg:col-span-3 sticky top-24 h-full">
            <Card className="glass-card h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Tiến Độ Làm Bài</span>
                </CardTitle>
                <CardDescription>
                  Hoàn thành {answeredCount} / {questions.length} câu hỏi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)] pr-1">
                {/* Question Number Grid grouped by Part */}
                {testSet.testType === 'interview' ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                        Câu hỏi phỏng vấn
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {answeredCount}/{questions.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {questions.map((q: any, index: number) => {
                        const isAnswered = !!answers[q._id];
                        const isActive = activeQuestionIndex === index;
                        return (
                          <button
                            key={q._id}
                            onClick={() => setActiveQuestionIndex(index)}
                            className={`h-7 w-7 flex items-center justify-center rounded-md text-[10px] font-bold transition-all ${
                              isActive
                                ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30 scale-110'
                                : isAnswered
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35'
                                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                            }`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  (['1', '2', '3', '4', '5', '6', '7'] as const).map((part) => {
                    const partQuestions = questions
                      .map((q: any, index: number) => ({ q, index }))
                      .filter(({ q }: { q: any }) => q.part === part);
                    if (partQuestions.length === 0) return null;

                    const partLabels: Record<string, string> = {
                      '1': 'Part 1 · Photos',
                      '2': 'Part 2 · Q&A',
                      '3': 'Part 3 · Conversations',
                      '4': 'Part 4 · Talks',
                      '5': 'Part 5 · Sentences',
                      '6': 'Part 6 · Paragraphs',
                      '7': 'Part 7 · Reading',
                    };

                    const firstNum = partQuestions[0].index + 1;
                    const lastNum = partQuestions[partQuestions.length - 1].index + 1;
                    const answeredInPart = partQuestions.filter(({ q }) => !!answers[q._id]).length;

                    return (
                      <div key={part} className="space-y-1.5">
                        {/* Part header */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                            {partLabels[part]}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {answeredInPart}/{partQuestions.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {partQuestions.map(({ q, index }) => {
                            const isAnswered = !!answers[q._id];
                            const isActive = activeQuestionIndex === index;
                            return (
                              <button
                                key={q._id}
                                onClick={() => setActiveQuestionIndex(index)}
                                className={`h-7 w-7 flex items-center justify-center rounded-md text-[10px] font-bold transition-all ${
                                  isActive
                                    ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30 scale-110'
                                    : isAnswered
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35'
                                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                                }`}
                              >
                                {index + 1}
                              </button>
                            );
                          })}
                        </div>
                        {/* Subtle separator */}
                        <div className="h-px bg-border/40 mt-1" />
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
