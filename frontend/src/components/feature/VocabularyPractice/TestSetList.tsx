import { Layers, ArrowLeft, Target, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVocabulary } from '@/hooks/useVocabulary';

interface TestSetListProps {
  selectedCategory: string;
  onBack: () => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  english: 'Tiếng Anh',
  chinese: 'Tiếng Trung',
  japanese: 'Tiếng Nhật',
  korean: 'Tiếng Hàn',
};

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function TestSetList({ selectedCategory, onBack }: TestSetListProps) {
  const router = useRouter();
  const { useTestSets } = useVocabulary();
  const { data: testSets, isLoading } = useTestSets(selectedCategory, 'public');
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  
  const categoryName = CATEGORY_NAMES[selectedCategory] || 'Ngôn ngữ';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-32 px-4">
      <div className="text-center md:text-left flex flex-col md:items-start gap-4">
        <Button
          variant="ghost"
          className="text-muted-foreground -ml-4 hover:text-primary transition-colors"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại chọn ngôn ngữ
        </Button>

        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center md:justify-start gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-[#C8982A] to-[#D4AF37] bg-clip-text text-transparent">
                Chọn Bộ Từ Vựng
              </span>
            </h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xl">
              Danh sách các bộ từ vựng hiện có cho {categoryName}.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 shrink-0 self-center md:self-auto mt-4 md:mt-0">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chế độ làm bài</span>
            <div className="bg-secondary/80 backdrop-blur-md p-1.5 rounded-2xl border border-border/60 flex shadow-inner">
              <button
                onClick={() => setMode('practice')}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'practice' ? 'bg-background shadow-md text-primary scale-[1.02] border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'}`}
              >
                <Target className="w-4 h-4" />
                Luyện tập
              </button>
              <button
                onClick={() => setMode('exam')}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'exam' ? 'bg-background shadow-md text-primary scale-[1.02] border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'}`}
              >
                <Timer className="w-4 h-4" />
                Thi thử
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse h-32 bg-secondary/30 rounded-xl border-none" />
          ))}
        </div>
      ) : testSets && testSets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testSets.map((test: any) => (
            <Card
              key={test._id}
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden group border-border/40 hover:border-primary/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-md"
              onClick={() => router.push(`/practice/vocabulary/${test._id}?mode=${mode}`)}
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
                <div className="mt-4 flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className="font-semibold text-xs text-primary bg-primary/10 border-primary/20"
                  >
                    {test.totalQuestions || 0} từ vựng
                  </Badge>
                  {test.accessLevel && test.accessLevel !== 'external' && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {test.accessLevel}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-border/40 bg-secondary/10 shadow-sm rounded-2xl">
          <p className="text-muted-foreground font-medium text-lg">
            Chưa có bộ từ vựng nào trong danh mục này.
          </p>
        </Card>
      )}
    </div>
  );
}
