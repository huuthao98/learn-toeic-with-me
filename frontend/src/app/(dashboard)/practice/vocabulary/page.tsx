'use client';

import { useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Languages,
  Layers,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useEffect } from 'react';

export default function VocabularyPracticePage() {
  // API hooks
  const { useTestSets, useTestQuestionsInfinite } = useVocabulary();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Use selectedCategory in API call
  const { data: testSets, isLoading: isTestsLoading } = useTestSets(
    selectedCategory || undefined,
    'public',
  );

  const [selectedTestId, setSelectedTestId] = useState<string>('');

  // State for current quiz
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Use infinite query for pagination
  const {
    data: infiniteData,
    isLoading: isQuestionsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTestQuestionsInfinite(selectedTestId || '', 20);

  const apiQuestions = infiniteData?.pages.flat() || [];

  // Use API questions if available, fallback to mock
  const mappedApiQuestions = apiQuestions.map((q: any) => ({
    id: q._id,
    word: q.questionText,
    type: 'vocabulary',
    pinyin: q.pinyin,
    correctAnswer: q.correctAnswer,
    options:
      q.options?.map((opt: any) => ({
        id: opt.label,
        value: opt.text,
      })) || [],
  }));

  const currentQuestions = mappedApiQuestions || [];

  // Fetch next page when reaching 5 questions before the end (e.g. index 14 out of 20)
  useEffect(() => {
    if (
      currentIndex >= currentQuestions.length - 5 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    currentIndex,
    currentQuestions.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  const currentQuestion = currentQuestions[currentIndex] || currentQuestions[0];

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  const handleTestChange = (val: string | null) => {
    if (val) {
      setSelectedTestId(val);
      resetQuiz();
    }
  };

  const handleSelectAnswer = (answerId: string) => {
    if (isAnswered) return;

    setSelectedAnswer(answerId);
    setIsAnswered(true);

    if (answerId === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const getOptionStatusClass = (optionId: string) => {
    if (!isAnswered) {
      return selectedAnswer === optionId
        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
        : 'hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800 border-border/50 bg-background/50';
    }

    // Đã trả lời
    if (optionId === currentQuestion.correctAnswer) {
      return 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)] scale-[1.02] transition-transform';
    }

    if (
      optionId === selectedAnswer &&
      selectedAnswer !== currentQuestion.correctAnswer
    ) {
      return 'border-destructive bg-destructive/10 opacity-80';
    }

    return 'border-border/20 bg-background/30 opacity-50';
  };

  if (!selectedCategory) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center md:justify-start gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Languages className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <span className="bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Luyện Tập Từ Vựng
            </span>
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-xl">
            Vui lòng chọn ngôn ngữ bạn muốn luyện tập hôm nay.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {[
            {
              id: 'english',
              label: 'Tiếng Anh',
              icon: '🇺🇸',
            },
            {
              id: 'chinese',
              label: 'Tiếng Trung',
              icon: '🇨🇳',
            },
            {
              id: 'japanese',
              label: 'Tiếng Nhật',
              icon: '🇯🇵',
            },
            {
              id: 'korean',
              label: 'Tiếng Hàn',
              icon: '🇰🇷',
            },
          ].map(lang => (
            <Card
              key={lang.id}
              className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden group"
              onClick={() => setSelectedCategory(lang.id)}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl`}
                >
                  {lang.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{lang.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    Luyện tập từ vựng {lang.label.toLowerCase()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedTestId) {
    const categoryName =
      [
        { id: 'english', label: 'Tiếng Anh' },
        { id: 'chinese', label: 'Tiếng Trung' },
        { id: 'japanese', label: 'Tiếng Nhật' },
        { id: 'korean', label: 'Tiếng Hàn' },
      ].find(l => l.id === selectedCategory)?.label || 'Ngôn ngữ';

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center md:text-left flex flex-col md:items-start gap-4">
          <Button
            variant="ghost"
            className="text-muted-foreground -ml-4 hover:text-primary"
            onClick={() => {
              setSelectedCategory(null);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại chọn ngôn ngữ
          </Button>

          <div>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center md:justify-start gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              <span className="bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Chọn Bộ Từ Vựng
              </span>
            </h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xl">
              Danh sách các bộ từ vựng hiện có cho {categoryName}.
            </p>
          </div>
        </div>

        {isTestsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse h-32 bg-secondary/20" />
            ))}
          </div>
        ) : testSets && testSets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testSets.map((test: any) => (
              <Card
                key={test._id}
                className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden group border-border/50 hover:border-primary/50"
                onClick={() => handleTestChange(String(test._id))}
              >
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {test.name}
                  </h3>
                  {test.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {test.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-semibold text-xs text-primary bg-primary/10"
                    >
                      {test.totalQuestions || 0} từ vựng
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-border/40 bg-secondary/10 shadow-sm">
            <p className="text-muted-foreground font-medium">
              Chưa có bộ từ vựng nào trong danh mục này.
            </p>
          </Card>
        )}
      </div>
    );
  }

  const activeTestSet = testSets?.find(
    (t: any) => String(t._id) === String(selectedTestId),
  );

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center md:text-left flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              className="mb-4 text-muted-foreground -ml-4 hover:text-primary"
              onClick={() => {
                setSelectedTestId('');
                resetQuiz();
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại chọn bộ đề
            </Button>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center md:justify-start gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Languages className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <span className="bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                {activeTestSet?.name || 'Luyện Tập Từ Vựng'}
              </span>
            </h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xl">
              {activeTestSet?.description ||
                'Nâng cao vốn từ vựng của bạn mỗi ngày. Trả lời nhanh, học thông minh và theo dõi tiến độ.'}
            </p>
          </div>

          <div className="bg-secondary/40 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 text-sm font-medium mt-12 md:mt-0">
            <span className="text-primary font-bold">{score}</span> điểm hôm nay
          </div>
        </div>

        <div className="w-full">
          <div className="mt-0 focus-visible:outline-none">
            {isQuestionsLoading ? (
              <Card className="p-12 text-center border-border/40 bg-secondary/10 shadow-sm">
                <p className="text-muted-foreground font-medium">
                  Đang tải câu hỏi...
                </p>
              </Card>
            ) : currentQuestions.length === 0 ? (
              <Card className="p-12 text-center border-border/40 bg-secondary/10 shadow-sm">
                <p className="text-muted-foreground font-medium">
                  {selectedTestId
                    ? 'Chưa có câu hỏi nào trong bộ từ vựng này.'
                    : 'Vui lòng chọn bộ từ vựng để bắt đầu.'}
                </p>
              </Card>
            ) : !isFinished ? (
              <div className="relative">
                {/* Progress bar */}
                <div className="absolute -top-4 left-0 right-0 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 ease-out"
                    style={{
                      width: `${(currentIndex / (activeTestSet?.totalQuestions || 1)) * 100}%`,
                    }}
                  />
                </div>

                <Card className="overflow-hidden border-border/40 shadow-xl shadow-primary/5 bg-gradient-to-b from-background to-secondary/10 backdrop-blur-xl">
                  <CardHeader className="flex justify-between items-center border-b border-border/10 bg-secondary/20 pb-6">
                    <Badge
                      variant="outline"
                      className="px-3 py-1 text-sm font-medium bg-background/50 backdrop-blur-sm border-primary/20 text-primary"
                    >
                      Câu hỏi {currentIndex + 1} /{' '}
                      {activeTestSet?.totalQuestions || '...'}
                    </Badge>

                    <div className="text-xs font-semibold uppercase tracking-wider">
                      Choose the correct answer
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>{score} đúng</span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-12 pb-10 flex flex-col items-center relative">
                    <div className="text-center mb-12 relative z-10">
                      <div className="flex items-center justify-center gap-3 mb-3 pl-10">
                        <h2 className="text-6xl font-black text-slate-800 dark:text-slate-100 tracking-tight drop-shadow-sm">
                          {currentQuestion.word}
                        </h2>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full hover:bg-primary/10 text-muted-foreground opacity-50 hover:opacity-100 hover:text-primary transition-all"
                          title={isCopied ? 'Đã sao chép' : 'Sao chép từ vựng'}
                          onClick={() => {
                            navigator.clipboard.writeText(currentQuestion.word);
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                            // toast.success('Đã sao chép từ vựng!');
                          }}
                        >
                          {isCopied ? (
                            <Check className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        {currentQuestion.pinyin && (
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="secondary"
                              className="text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-500/10 cursor-pointer transition-all hover:bg-teal-500/20 px-3 py-1"
                              onClick={() => setShowPinyin(!showPinyin)}
                            >
                              {showPinyin ? currentQuestion.pinyin : '***'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-teal-600 hover:bg-teal-500/10 rounded-full"
                              onClick={() => setShowPinyin(!showPinyin)}
                              title={showPinyin ? 'Ẩn Pinyin' : 'Hiện Pinyin'}
                            >
                              {showPinyin ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto z-10">
                      {currentQuestion.options.map((option: any) => (
                        <button
                          key={option.id}
                          onClick={() => handleSelectAnswer(option.id)}
                          disabled={isAnswered}
                          className={`
                            relative p-5 rounded-2xl border text-left transition-all duration-300
                            flex items-center justify-between group
                            ${getOptionStatusClass(option.id)}
                          `}
                        >
                          <span className="font-semibold text-foreground/90 group-hover:text-foreground">
                            {option.value}
                          </span>

                          {/* Icons for answer state */}
                          {isAnswered &&
                            option.id === currentQuestion.correctAnswer && (
                              <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 animate-in zoom-in" />
                            )}
                          {isAnswered &&
                            selectedAnswer === option.id &&
                            selectedAnswer !==
                              currentQuestion.correctAnswer && (
                              <XCircle className="w-6 h-6 text-destructive shrink-0 animate-in zoom-in" />
                            )}
                        </button>
                      ))}
                    </div>

                    {/* Background decorative elements */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0 pointer-events-none" />
                  </CardContent>

                  <CardFooter className="bg-secondary/20 border-t border-border/10 py-5 flex justify-between items-center px-8">
                    <div className="text-sm font-medium text-muted-foreground">
                      {isAnswered &&
                        (selectedAnswer === currentQuestion.correctAnswer ? (
                          <span className="text-emerald-500 flex items-center gap-1.5 animate-in slide-in-from-left-2">
                            <CheckCircle className="w-4 h-4" /> Tuyệt vời!
                          </span>
                        ) : (
                          <span className="text-destructive flex items-center gap-1.5 animate-in slide-in-from-left-2">
                            <XCircle className="w-4 h-4" /> Sai rồi!
                          </span>
                        ))}
                    </div>

                    <Button
                      onClick={handleNext}
                      disabled={!isAnswered}
                      size="lg"
                      className="gap-2 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                      {currentIndex === currentQuestions.length - 1
                        ? 'Hoàn thành bài tập'
                        : 'Câu tiếp theo'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <Card className="border-border/40 shadow-2xl shadow-primary/10 bg-gradient-to-b from-background to-primary/5 backdrop-blur-xl overflow-hidden relative">
                <CardHeader className="pt-16 pb-8 text-center relative z-10">
                  <div className="relative mx-auto mb-6 w-28 h-28">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-70" />
                    <div className="relative w-full h-full bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center border-4 border-emerald-500/30">
                      <CheckCircle className="h-14 w-14 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-extrabold tracking-tight mb-2">
                    Hoàn Thành Bài Tập!
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Bạn đã xuất sắc trả lời đúng
                  </CardDescription>
                  <div className="text-5xl font-black text-primary my-6">
                    {score} / {currentQuestions.length}
                  </div>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {score === currentQuestions.length
                      ? 'Hoàn hảo! Bạn đã nắm vững toàn bộ từ vựng trong bài này.'
                      : 'Cố gắng lên nhé, luyện tập thường xuyên sẽ giúp bạn nhớ từ lâu hơn!'}
                  </p>
                </CardHeader>
                <CardFooter className="justify-center pb-16 relative z-10">
                  <Button
                    onClick={resetQuiz}
                    size="lg"
                    className="gap-2 rounded-xl h-12 px-8 text-base shadow-xl shadow-primary/20"
                  >
                    <BookOpen className="h-5 w-5" />
                    Luyện tập lại
                  </Button>
                </CardFooter>

                {/* Confetti-like background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-0">
                  <div className="absolute top-10 left-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                  <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
