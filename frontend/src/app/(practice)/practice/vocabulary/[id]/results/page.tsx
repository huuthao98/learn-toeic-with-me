'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Check,
  BookOpen,
} from 'lucide-react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVocabulary } from '@/hooks/useVocabulary';

export default function VocabularyResultPage() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const resultId = searchParams.get('resultId');
  const localResultId = searchParams.get('localResultId');
  const router = useRouter();

  const { useTestSet, useTestQuestions, useTestResult } = useVocabulary();
  const { data: testSet, isLoading: isTestLoading } = useTestSet(id);
  const { data: questions, isLoading: isQuestionsLoading } =
    useTestQuestions(id);
  const { data: resultDataApi, isLoading: isResultLoadingApi } = useTestResult(
    resultId || '',
  );

  const [localResultData, setLocalResultData] = useState<any>(null);

  useEffect(() => {
    if (localResultId) {
      const data = sessionStorage.getItem(localResultId);
      if (data) {
        setLocalResultData(JSON.parse(data));
      }
    }
  }, [localResultId]);

  const resultData = resultId ? resultDataApi : localResultData;
  const isResultLoading = resultId
    ? isResultLoadingApi
    : !localResultData && localResultId;

  if (isTestLoading || isQuestionsLoading || isResultLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-muted-foreground">
            Đang tải kết quả...
          </p>
        </div>
      </div>
    );
  }

  if (!testSet || !resultData || !questions) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8 text-center">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy dữ liệu</h2>
        <p className="text-muted-foreground mb-6">
          Có thể kết quả bài kiểm tra này không tồn tại hoặc đã bị xóa.
        </p>
        <Button size="lg" onClick={() => router.push('/practice/vocabulary')}>
          Quay Lại Danh Mục
        </Button>
      </div>
    );
  }

  const userAnswers = resultData.answers || {};
  const totalQuestions = questions.length;
  const score = resultData.score || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-4 w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/practice/vocabulary')}
            className="hover:bg-secondary rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold truncate">
              Kết quả: {testSet.name}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-8 space-y-8">
        {/* Score Summary */}
        <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-card to-secondary/30">
          <CardContent className="p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-background shadow-inner">
                <svg
                  className="absolute inset-0 h-full w-full -rotate-90 transform"
                  viewBox="0 0 36 36"
                >
                  <path
                    className="text-secondary"
                    strokeDasharray="100, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-primary transition-all duration-1000 ease-out"
                    strokeDasharray={`${(score / totalQuestions) * 100}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center flex flex-col items-center">
                  <span className="text-3xl font-black text-primary">
                    {score}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    Đúng
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold">Hoàn thành bài tập!</h2>
                <p className="text-muted-foreground">
                  Bạn đã trả lời đúng {score} trên tổng số {totalQuestions} câu
                  hỏi.
                </p>
                <Badge variant="outline" className="mt-2 bg-background">
                  <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                  Vocabulary Test
                </Badge>
              </div>
            </div>

            <Button
              size="lg"
              className="rounded-xl font-bold shadow-md w-full sm:w-auto h-12 px-8"
              onClick={() => router.push(`/practice/vocabulary/${id}`)}
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Làm Lại Bài Này
            </Button>
          </CardContent>
        </Card>

        {/* Detailed Review */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold px-1">Chi tiết câu trả lời</h3>

          <div className="grid gap-4">
            {questions.map((q: any, idx: number) => {
              const userAns = userAnswers[q._id];
              const correctAns = q.correctAnswer;
              const isCorrect = userAns === correctAns;

              const options = q.options || [];

              return (
                <div key={q._id} className="space-y-4">
                  {q.passageContext && (
                    <div className="bg-secondary/20 p-4 rounded-xl border border-border/50 mt-4">
                      <div className="text-sm md:text-base font-medium whitespace-pre-wrap leading-relaxed text-foreground/90">
                        {q.passageContext}
                      </div>
                    </div>
                  )}
                  <Card
                    className={`overflow-hidden transition-all border-l-4 ${isCorrect ? 'border-l-emerald-500 shadow-emerald-500/10 hover:shadow-emerald-500/20' : 'border-l-rose-500 shadow-rose-500/10 hover:shadow-rose-500/20'}`}
                  >
                    <CardHeader className="bg-secondary/20">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start md:items-center gap-3 flex-col md:flex-row">
                          <Badge
                            variant="outline"
                            className="font-bold bg-background shrink-0"
                          >
                            Câu {idx + 1}
                          </Badge>
                          {testSet?.category?.toLowerCase() === 'japanese' || testSet?.category?.toLowerCase() === 'jlpt' ? (
                            <span 
                              className="text-base md:text-lg font-bold leading-relaxed [&_strong]:text-red-500 dark:[&_strong]:text-red-400 [&_strong]:underline [&_strong]:underline-offset-4 [&_rt]:text-[0.5em] [&_rt]:font-medium [&_rt]:text-muted-foreground/80"
                              dangerouslySetInnerHTML={{ __html: q.questionText }}
                            />
                          ) : (
                            <span className="text-xl font-bold">
                              {q.questionText}
                            </span>
                          )}
                          {q.pinyin && (
                            <span className="text-sm text-muted-foreground">
                              ({q.pinyin})
                            </span>
                          )}
                        </div>
                        {isCorrect ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-full text-sm shrink-0">
                            <CheckCircle2 className="w-4 h-4" /> Đúng
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-500 font-bold bg-rose-500/10 px-3 py-1 rounded-full text-sm shrink-0">
                            <XCircle className="w-4 h-4" /> Sai
                          </div>
                        )}
                      </div>
                    </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-1">
                      {options.map((opt: any) => {
                        let btnClass = 'border-border/50 bg-background';
                        let icon = null;

                        if (opt.label === correctAns) {
                          btnClass =
                            'border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/20';
                          icon = <Check className="w-4 h-4 text-emerald-600" />;
                        } else if (opt.label === userAns && !isCorrect) {
                          btnClass =
                            'border-rose-500 bg-rose-500/10 opacity-80';
                          icon = <XCircle className="w-4 h-4 text-rose-600" />;
                        }

                        return (
                          <div
                            key={opt.label}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${btnClass}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg text-primary/70">
                                {opt.label}.
                              </span>
                              <div>
                                <span className="font-semibold">
                                  {opt.text}
                                </span>
                                {opt.pinyin && (
                                  <span className="block text-xs text-muted-foreground">
                                    {opt.pinyin}
                                  </span>
                                )}
                              </div>
                            </div>
                            {icon}
                          </div>
                        );
                      })}
                    </div>

                    {!userAns && (
                      <div className="mb-6 inline-flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold px-4 py-2 rounded-lg text-sm">
                        ⚠️ Bạn đã không trả lời câu hỏi này.
                      </div>
                    )}

                    {q.explanation && (
                      <div className="mt-2 bg-primary/5 rounded-xl p-4 border border-primary/10">
                        <span className="font-bold text-sm text-primary flex items-center gap-2 mb-1">
                          <BookOpen className="w-4 h-4" /> Giải thích:
                        </span>
                        <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                          {q.explanation}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
