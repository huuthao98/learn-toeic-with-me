import { Languages } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CategorySelectionProps {
  onSelectCategory: (category: string) => void;
}

export function CategorySelection({ onSelectCategory }: CategorySelectionProps) {
  const categories = [
    { id: 'english', label: 'Tiếng Anh', icon: '🇺🇸' },
    { id: 'chinese', label: 'Tiếng Trung', icon: '🇨🇳' },
    { id: 'japanese', label: 'Tiếng Nhật', icon: '🇯🇵' },
    { id: 'korean', label: 'Tiếng Hàn', icon: '🇰🇷' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pt-32 px-4">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center md:justify-start gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Languages className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <span className="bg-gradient-to-r from-[#C8982A] to-[#D4AF37] bg-clip-text text-transparent">
            Luyện Tập Từ Vựng
          </span>
        </h1>
        <p className="text-base text-muted-foreground mt-2 max-w-xl">
          Vui lòng chọn ngôn ngữ bạn muốn luyện tập hôm nay.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {categories.map(lang => (
          <Card
            key={lang.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group border-border/50 hover:border-primary/40 bg-card/60 backdrop-blur-sm"
            onClick={() => onSelectCategory(lang.id)}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-secondary/50 group-hover:bg-primary/10 transition-colors">
                {lang.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{lang.label}</h3>
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
