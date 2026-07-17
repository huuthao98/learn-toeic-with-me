'use client';

import {
  Clock,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useVocabulary } from '@/hooks/useVocabulary';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function PracticeVocabularyRunner({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testSetId = id;

  const { useTestSet, useTestQuestions, useSubmitExamMutation } = useVocabulary();
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

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedOpt(label);
        setTimeout(() => setCopiedOpt(null), 2000);
      })
      .catch(err => {
        console.error('Không thể sao chép: ', err);
      });
  };

  const handleCopyQuestion = () => {
    if (!questions) return;
    const cQ = questions[activeQuestionIndex];
    if (!cQ) return;

    let textToCopy = '';
    if (cQ.questionText) {
      textToCopy += `[Câu hỏi]\n${cQ.questionText}\n\n`;
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
      .catch(err => {
        console.error('Không thể sao chép: ', err);
      });
  };

  useEffect(() => {
    if (questions && questions.length > 0) {
      setTimeLeft(3600); // 1 hour for vocabulary
    }
  }, [questions]);

  // Timer interval
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleSubmitExam = async () => {
    if (!testSetId) return;
    try {
      const duration = Math.floor((Date.now() - startTime) / 60000);
      const res = await submitExamMutation.mutateAsync({
        answers,
        durationMinutes: duration,
      });

      if (res && res._id) {
        router.push(`/practice/vocabulary/${testSetId}/results?resultId=${res._id}`);
      }
    } catch (error) {
      console.error('Lỗi khi nộp bài:', error);
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    }
  };

  const handleSelectOption = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
    // Auto next after 300ms
    setTimeout(() => {
      if (questions && activeQuestionIndex < questions.length - 1) {
        setActiveQuestionIndex(prev => prev + 1);
      }
    }, 300);
  };

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
          <p className="text-sm text-muted-foreground font-semibold">
            Đang chuẩn bị đề thi...
          </p>
        </div>
      </div>
    );
  }

  if (!testSet || !questions || questions.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
        <HelpCircle className="h-12 w-12 text-muted-foreground" />
        <h4 className="text-lg font-bold">Không tìm thấy đề thi</h4>
        <Button onClick={() => router.push(ROUTES.PRACTICE_VOCABULARY)}>
          Quay lại thư viện
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[activeQuestionIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      {/* Top Header */}
      <div className="glass-panel border-b border-border/40 h-16 sticky top-0 z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Tiến trình thi sẽ bị hủy. Bạn có muốn thoát?')) {
                router.push(ROUTES.PRACTICE_VOCABULARY);
              }
            }}
            className="p-2 rounded-lg bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h3 className="font-bold text-sm truncate max-w-xs sm:max-w-md">
              {testSet.name}
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Vocabulary Test
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full font-mono font-bold border border-primary/20">
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
          <Button
            size="sm"
            onClick={() => setIsSubmitDialogOpen(true)}
            className="hidden sm:flex font-bold"
          >
            Nộp bài
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Nav */}
        <div className="hidden md:flex w-72 flex-col border-r border-border/40 bg-card/30">
          <div className="p-4 border-b border-border/40">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-sm">Danh sách câu hỏi</h4>
              <span className="text-xs font-medium text-muted-foreground">
                {answeredCount}/{questions.length}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5 mb-1">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q._id}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`
                    h-10 w-full rounded-md text-sm font-medium transition-all relative
                    ${
                      activeQuestionIndex === idx
                        ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : answers[q._id]
                          ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }
                  `}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-dot-pattern">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar">
            <div className="max-w-4xl mx-auto flex flex-col h-full gap-8">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-bold px-4 py-1.5 rounded-full shadow-sm">
                  Câu hỏi {activeQuestionIndex + 1} / {questions.length}
                </div>
                <button
                  onClick={handleCopyQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>

              <div className="bg-card border border-border shadow-sm rounded-xl p-6 sm:p-8 space-y-8">
                {/* Question */}
                <div className="text-xl md:text-2xl font-semibold leading-relaxed text-foreground break-words">
                  {currentQuestion.questionText}
                </div>

                {/* Options */}
                {currentQuestion.options && currentQuestion.options.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((opt: any) => {
                      const isSelected = answers[currentQuestion._id] === opt.label;
                      return (
                        <div key={opt.label} className="relative group">
                          <label
                            className={`
                              flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all h-full
                              ${
                                isSelected
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-border/60 bg-card hover:border-primary/40 hover:bg-secondary/50'
                              }
                            `}
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestion._id}`}
                              value={opt.label}
                              checked={isSelected}
                              onChange={() => handleSelectOption(currentQuestion._id, opt.label)}
                              className="w-5 h-5 accent-primary cursor-pointer mt-0.5"
                            />
                            <div className="flex-1">
                              <span className="font-bold text-lg w-6 inline-block text-primary/80">
                                {opt.label}.
                              </span>
                              <span className="text-base font-medium">{opt.text}</span>
                              {opt.pinyin && <span className="block text-sm text-muted-foreground">{opt.pinyin}</span>}
                            </div>
                          </label>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleCopyText(opt.text, opt.label);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-md bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground hover:bg-secondary"
                            title="Sao chép đáp án"
                          >
                            {copiedOpt === opt.label ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 bg-card/80 backdrop-blur-md p-4 sm:px-6 shrink-0">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1))}
                disabled={activeQuestionIndex === 0}
                className="w-28 sm:w-32 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Trước
              </Button>

              <div className="flex md:hidden flex-col items-center">
                <span className="text-sm font-bold">
                  {activeQuestionIndex + 1} / {questions.length}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Đã làm {answeredCount}
                </span>
              </div>

              {activeQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={() => setIsSubmitDialogOpen(true)}
                  className="w-28 sm:w-32 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Nộp bài
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    setActiveQuestionIndex(Math.min(questions.length - 1, activeQuestionIndex + 1))
                  }
                  className="w-28 sm:w-32 font-medium"
                >
                  Sau
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isSubmitDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-2 text-foreground">Nộp bài thi?</h3>
            <p className="text-muted-foreground mb-6">
              Bạn đã hoàn thành <strong className="text-foreground">{answeredCount}</strong> /{' '}
              {questions.length} câu hỏi.
              {answeredCount < questions.length && (
                <span className="text-destructive block mt-2 font-medium">
                  ⚠️ Vẫn còn {questions.length - answeredCount} câu chưa làm.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                Tiếp tục
              </Button>
              <Button onClick={() => { setIsSubmitDialogOpen(false); handleSubmitExam(); }} disabled={submitExamMutation.isPending}>
                {submitExamMutation.isPending ? 'Đang nộp...' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
