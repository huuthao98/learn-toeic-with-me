'use client';

import { toast } from 'sonner';
import {
  ArrowLeft,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Star,
  Trophy,
  CheckCircle,
  XCircle,
  Flame,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useB1 } from '@/hooks/useB1';
import { B1Question } from '@/api/b1';

const SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const;
type Skill = (typeof SKILLS)[number];

const skillMeta: Record<
  Skill,
  { label: string; labelVi: string; icon: React.ElementType; color: string }
> = {
  listening: { label: 'Listening', labelVi: 'Kỹ năng Nghe', icon: Headphones, color: 'emerald' },
  reading: { label: 'Reading', labelVi: 'Kỹ năng Đọc', icon: BookOpen, color: 'blue' },
  writing: { label: 'Writing', labelVi: 'Kỹ năng Viết', icon: PenTool, color: 'amber' },
  speaking: { label: 'Speaking', labelVi: 'Kỹ năng Nói', icon: Mic, color: 'purple' },
};

const colorMap: Record<
  string,
  { ring: string; text: string; badge: string; bg: string; border: string }
> = {
  emerald: {
    ring: 'ring-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    border: 'border-emerald-500/20',
  },
  blue: {
    ring: 'ring-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50/60 dark:bg-blue-950/20',
    border: 'border-blue-500/20',
  },
  amber: {
    ring: 'ring-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50/60 dark:bg-amber-950/20',
    border: 'border-amber-500/20',
  },
  purple: {
    ring: 'ring-purple-400',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50/60 dark:bg-purple-950/20',
    border: 'border-purple-500/20',
  },
};

export default function B1ResultsPage() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const resultId = searchParams.get('resultId');
  const localResultId = searchParams.get('localResultId');
  const router = useRouter();

  const { useTestSet, useTestQuestions, useTestResult } = useB1();
  const { data: testSet, isLoading: isTestLoading } = useTestSet(id);
  const { data: questions, isLoading: isQuestionsLoading } = useTestQuestions(id);
  const { data: serverResultData, isLoading: isServerResultLoading } = useTestResult(
    resultId || '',
  );

  const [localResultData, setLocalResultData] = useState<any>(null);
  const [activeSkill, setActiveSkill] = useState<Skill>('listening');

  useEffect(() => {
    if (localResultId) {
      const stored = sessionStorage.getItem(localResultId);
      if (stored) {
        setLocalResultData(JSON.parse(stored));
      } else {
        toast.error('Không tìm thấy kết quả làm bài!');
        router.push('/exam-english');
      }
    }
  }, [localResultId, router]);

  const resultData = localResultId ? localResultData : serverResultData;
  const isResultLoading = resultId
    ? isServerResultLoading
    : localResultId
      ? !localResultData
      : false;

  // Answers map: questionId → userAnswer
  const submittedAnswers: Record<string, string> = useMemo(
    () => resultData?.answers ?? {},
    [resultData],
  );

  // Group questions by skill → setId
  const groupedBySkill = useMemo(() => {
    if (!questions) return {} as Record<Skill, B1Question[][]>;
    const result: Record<string, B1Question[][]> = {};
    for (const skill of SKILLS) {
      const skillQs = [...questions]
        .filter(q => q.skill === skill)
        .sort((a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0));

      // Group by setId (questions with same setId share a passageContext)
      const groups: Record<string, B1Question[]> = {};
      for (const q of skillQs) {
        const key = q.setId ? `set_${q.setId}` : `single_${q._id}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(q);
      }
      result[skill] = Object.values(groups);
    }
    return result as Record<Skill, B1Question[][]>;
  }, [questions]);

  // Score helpers
  const listeningScore: number = resultData?.listeningScore ?? 0;
  const readingScore: number = resultData?.readingScore ?? 0;
  const totalEarned: number = resultData?.totalEarned ?? 0;
  const correctCount: number = resultData?.correctCount ?? 0;
  const totalQuestions: number = resultData?.totalQuestions ?? 0;
  const currentStreak: number = resultData?.currentStreak ?? 0;
  const overallScore = (listeningScore + readingScore) / 2;
  const accuracyPct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const breakdown = resultData?.breakdown ?? {};

  const skillScores: Record<Skill, number | null> = {
    listening: listeningScore,
    reading: readingScore,
    writing: resultData?.writingScore ?? null,
    speaking: resultData?.speakingScore ?? null,
  };

  if (isTestLoading || isQuestionsLoading || isResultLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span className="animate-pulse">Đang tải kết quả...</span>
        </div>
      </div>
    );
  }

  if (!testSet || !resultData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <p className="text-destructive text-lg font-medium">Không tìm thấy dữ liệu kết quả.</p>
        <Button onClick={() => router.push('/exam-english')}>Quay Lại</Button>
      </div>
    );
  }

  const activeGroups = groupedBySkill[activeSkill] ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 pt-2 pb-24">
      {/* ─── Sticky Top Bar (giống InteractiveB1Runner) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background/80 backdrop-blur-md sticky top-0 z-40 py-2">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Back */}
          <Button
            variant="destructive"
            className="shrink-0"
            onClick={() => router.push('/exam-english')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Thoát
          </Button>

          {/* Skill tabs */}
          {SKILLS.map(skill => {
            const meta = skillMeta[skill];
            const score = skillScores[skill];
            const c = colorMap[meta.color];
            const isActive = skill === activeSkill;
            const pending = skill === 'writing' || skill === 'speaking';
            return (
              <button
                key={skill}
                onClick={() => setActiveSkill(skill)}
                className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                  isActive
                    ? `${c.bg} ${c.border} ${c.text} ring-2 ${c.ring}`
                    : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <meta.icon className="w-3 h-3" />
                {meta.label}:{' '}
                {pending ? '—' : score !== null ? `${(score as number).toFixed(1)}` : '—'}
              </button>
            );
          })}
        </div>

        {/* Overall score pill */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">{overallScore.toFixed(1)}/10</span>
          </div>
          {accuracyPct > 0 && (
            <div className="flex items-center gap-1.5 bg-muted/60 border border-border rounded-full px-3 py-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {correctCount}/{totalQuestions} đúng
              </span>
            </div>
          )}
          {totalEarned > 0 && (
            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-xs font-bold text-yellow-600">+{totalEarned} XP</span>
            </div>
          )}
          {currentStreak > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-bold text-orange-600">{currentStreak} ngày</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Mobile skill tabs ─── */}
      <div className="flex sm:hidden gap-2 flex-wrap">
        {SKILLS.map(skill => {
          const meta = skillMeta[skill];
          const score = skillScores[skill];
          const c = colorMap[meta.color];
          const isActive = skill === activeSkill;
          const pending = skill === 'writing' || skill === 'speaking';
          return (
            <button
              key={skill}
              onClick={() => setActiveSkill(skill)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all ${
                isActive
                  ? `${c.bg} ${c.border} ${c.text} ring-2 ${c.ring}`
                  : 'bg-muted/40 border-border text-muted-foreground'
              }`}
            >
              <meta.icon className="w-3 h-3" />
              {meta.label}:{' '}
              {pending ? '—' : score !== null ? `${(score as number).toFixed(1)}` : '—'}
            </button>
          );
        })}
      </div>

      {/* ─── Question review groups ─── */}
      <div className="flex flex-col gap-6">
        {activeGroups.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Không có câu hỏi trong kỹ năng này.
          </div>
        ) : (
          activeGroups.map((group, gi) => {
            const firstQ = group[0];
            const isMulti = group.length > 1;

            return (
              <div key={gi} className="space-y-4">
                {/* Passage Context */}
                {firstQ.passageContext && (
                  <Card className="shadow-md border-primary/10 bg-secondary/10">
                    <CardContent className="p-5">
                      {activeSkill === 'writing' && (
                        <h3 className="font-semibold text-base text-primary mb-3 flex items-center gap-2">
                          <PenTool className="w-4 h-4" /> Ngữ cảnh / Đề bài
                        </h3>
                      )}
                      <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-serif">
                        {firstQ.passageContext}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Multi-question group (Listening Part 2/3) */}
                {isMulti ? (
                  <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                    {group.map(q => (
                      <QuestionCard key={q._id} q={q} userAnswer={submittedAnswers[q._id]} />
                    ))}
                  </div>
                ) : (
                  /* Single question */
                  <QuestionCard q={firstQ} userAnswer={submittedAnswers[firstQ._id]} large />
                )}
              </div>
            );
          })
        )}

        {/* XP breakdown & actions — hiển thị sau phần writing */}
        {activeSkill === 'speaking' && (
          <div className="space-y-4 mt-4">
            {totalEarned > 0 && (
              <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <h3 className="font-bold text-yellow-700 dark:text-yellow-400">
                      Phần thưởng kinh nghiệm
                    </h3>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {breakdown.correctAnswers > 0 && (
                      <BreakdownRow label="Câu trả lời đúng" xp={breakdown.correctAnswers} />
                    )}
                    {breakdown.lessonCompletion > 0 && (
                      <BreakdownRow label="Hoàn thành bài thi" xp={breakdown.lessonCompletion} />
                    )}
                    {breakdown.perfectLesson > 0 && (
                      <BreakdownRow label="Làm hoàn hảo" xp={breakdown.perfectLesson} />
                    )}
                    {breakdown.streakBonus > 0 && (
                      <BreakdownRow label="Thưởng streak" xp={breakdown.streakBonus} />
                    )}
                    {breakdown.speedDemon > 0 && (
                      <BreakdownRow label="Speed demon" xp={breakdown.speedDemon} />
                    )}
                    <div className="border-t border-yellow-400/30 pt-2 mt-2 flex justify-between font-bold text-base">
                      <span className="text-yellow-700 dark:text-yellow-400">Tổng cộng</span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-500">
                        +{totalEarned} XP
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <Button size="lg" onClick={() => router.push('/exam-english')} className="gap-2">
                Làm đề khác <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push(`/admin/detail-b1/${testSet._id}`)}
              >
                Xem lại đề
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface QuestionCardProps {
  q: B1Question;
  userAnswer?: string;
  large?: boolean;
}

function QuestionCard({ q, userAnswer, large = false }: QuestionCardProps) {
  const isCorrect = userAnswer === q.correctAnswer;
  const isAnswered = !!userAnswer;
  if (q.skill === 'speaking' || q.skill === 'writing') return null;
  return (
    <Card
      className={`shadow-md border-t-4 ${isAnswered ? (isCorrect ? 'border-t-emerald-500' : 'border-t-red-500') : 'border-t-muted'}`}
    >
      <CardContent className={large ? 'p-4' : 'p-3'}>
        {/* Question header */}

        <div className={`mb-4 flex items-start gap-2 ${large ? '' : 'flex-col'}`}>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`font-bold ${large ? 'text-xl' : 'text-sm'} text-foreground whitespace-nowrap`}
            >
              {q.questionNumber ? `Câu ${q.questionNumber}` : 'Câu hỏi'}.
            </span>

            {isAnswered ? (
              isCorrect ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              )
            ) : (
              <span className="text-xs text-muted-foreground italic">(bỏ qua)</span>
            )}
          </div>
          {q.questionText && (
            <p
              className={`${large ? 'text-lg' : 'text-sm'} font-medium text-foreground leading-relaxed`}
            >
              {q.questionText}
            </p>
          )}
        </div>

        {/* Options */}
        {q.questionType === 'multiple_choice' && q.options && (
          <div className={`grid gap-2 ${large ? 'grid-cols-2' : 'grid-cols-2'}`}>
            {q.options.map(opt => {
              const isUserPick = userAnswer === opt.label;
              const isRight = q.correctAnswer === opt.label;
              const isWrong = isUserPick && !isRight;

              return (
                <div
                  key={opt.label}
                  className={`
                    p-2 rounded-xl border flex items-center gap-3 text-sm transition-none
                    ${
                      isRight
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : isWrong
                          ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-500/10 dark:text-red-300'
                          : 'border-border/50 bg-background text-foreground/70'
                    }
                  `}
                >
                  <div
                    className={`
                    flex items-center justify-center w-7 h-7 rounded-full font-bold shrink-0 text-xs
                    ${
                      isRight
                        ? 'bg-emerald-500 text-white'
                        : isWrong
                          ? 'bg-red-500 text-white'
                          : 'bg-muted text-muted-foreground'
                    }
                  `}
                  >
                    {opt.label}
                  </div>
                  <span className="flex-1 font-medium">{opt.text}</span>
                  {isRight && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {isWrong && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Writing / Speaking: hiển thị câu trả lời của user (nếu có) */}
        {(q.questionType === 'essay' || q.questionType === 'speaking') && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground italic">
            {userAnswer ? userAnswer : '(Không có câu trả lời)'}
          </div>
        )}

        {/* Explanation */}
        {q.explanation && q.questionType === 'multiple_choice' && (
          <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-1 text-xs">
              <CheckCircle className="w-3.5 h-3.5" /> Giải thích:
            </h4>
            <p className="text-blue-800 dark:text-blue-400 text-xs leading-relaxed">
              {q.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownRow({ label, xp }: { label: string; xp: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-yellow-700 dark:text-yellow-400">+{xp} XP</span>
    </div>
  );
}
