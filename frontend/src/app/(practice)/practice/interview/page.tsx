'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, List, Loader2, Copy, Check } from 'lucide-react';
import { useInterview } from '@/hooks/useInterview';

export default function PracticeInterviewPage() {
  const { useTestSets, useTestQuestions } = useInterview();
  const { data: testSets, isLoading: isTestsLoading } = useTestSets('public');

  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );

  const toggleQuestionExpand = (id: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Auto-select the first test if none is selected and data is available
  useEffect(() => {
    if (testSets && testSets.length > 0 && !selectedTestId) {
      setSelectedTestId(testSets[0]._id);
    }
  }, [testSets, selectedTestId]);

  const { data: questions, isLoading: isQuestionsLoading } = useTestQuestions(
    selectedTestId || '',
  );

  const selectedTest = testSets?.find(t => t._id === selectedTestId);

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-6rem)] space-y-6 pt-32 px-4 sm:px-6 lg:px-8 mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-[#0F2356] animate-bounce" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#C8982A] to-[#D4AF37]">
              Luyện tập phỏng vấn
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chọn một đề phỏng vấn bên trái để xem các câu hỏi và bắt đầu luyện
            tập.
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="flex flex-1 gap-6 overflow-hidden pb-4">
          {/* Left Column: List of Tests */}
          {isTestsLoading ? (
            <Card className="w-50 flex flex-col h-full border-2 border-indigo-500/20 bg-background/50">
              <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  <span className="text-xs font-medium">Đang tải danh sách...</span>
                </div>
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="h-10 rounded-md bg-secondary/40 animate-pulse"
                  />
                ))}
              </CardContent>
            </Card>
          ) : testSets && testSets.length > 0 ? (
            <Card className="w-50 flex flex-col h-full border-2 border-indigo-500/20 bg-background/50 ">
              <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
                {testSets.map(test => (
                  <div
                    key={test._id}
                    onClick={() => setSelectedTestId(test._id)}
                    className={`flex justify-between items-center cursor-pointer px-4 py-2 rounded-md border transition-all duration-200 group ${
                      selectedTestId === test._id
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                        : 'border-border/40 hover:border-indigo-300 hover:bg-secondary/50'
                    }`}
                  >
                    <h3
                      className={`font-bold text-sm line-clamp-2 ${selectedTestId === test._id ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground'}`}
                    >
                      {test.name}
                    </h3>

                    {selectedTestId === test._id && (
                      <b
                        className={`text-sm ${
                          selectedTestId === test._id
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-foreground'
                        }`}
                      >
                        {test.totalQuestions}
                      </b>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card className="flex-1 flex flex-col h-full border-2 border-indigo-500/20 bg-background/50">
            {isTestsLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : selectedTest ? (
              <>
                <CardContent className="flex-1 overflow-y-auto p-2">
                  {isQuestionsLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                      <p>Đang tải câu hỏi...</p>
                    </div>
                  ) : questions && questions.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        {questions.map((q, index) => (
                          <div
                            key={q._id}
                            className="bg-card border border-border/40 rounded-xl flex flex-col hover:border-indigo-300 transition-colors group"
                          >
                            <div
                              className="flex gap-4 items-center p-4 cursor-pointer select-none"
                              onClick={() => toggleQuestionExpand(q._id)}
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1 flex items-center justify-between gap-2">
                                <p className="font-medium text-foreground flex-1">
                                  {q.questionText}
                                </p>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      q.questionText,
                                    );
                                    setCopiedId(q._id);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                  className={`mt-0.5 p-1 shrink-0 rounded-md transition-all cursor-pointer ${
                                    copiedId === q._id
                                      ? 'text-green-500 bg-green-500/10 opacity-100'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80 opacity-0 group-hover:opacity-100'
                                  }`}
                                  title="Sao chép nội dung câu hỏi"
                                >
                                  {copiedId === q._id ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {expandedQuestions.has(q._id) && (
                              <div className="pr-4 pl-16 pb-4 flex flex-col gap-3">
                                {q.correctAnswer && (
                                  <div className="flex flex-col p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg text-sm">
                                    <span className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                                      Câu trả lời:
                                    </span>
                                    <span className="text-blue-900 dark:text-blue-300 whitespace-pre-wrap leading-relaxed">
                                      {q.correctAnswer}
                                    </span>
                                  </div>
                                )}

                                {q.explanation && (
                                  <div className="flex flex-col p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg text-sm">
                                    <span className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                                      Giải thích chi tiết:
                                    </span>
                                    <span className="text-blue-900 dark:text-blue-300 whitespace-pre-wrap leading-relaxed">
                                      {q.explanation}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <List className="w-12 h-12 mb-3 text-border" />
                      <p>Đề này hiện chưa có câu hỏi nào.</p>
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Bot className="w-16 h-16 mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium text-foreground">
                  Hiện chưa có đề phỏng vấn nào.
                </h3>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
