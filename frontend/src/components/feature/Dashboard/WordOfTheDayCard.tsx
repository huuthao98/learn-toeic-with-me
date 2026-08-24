'use client';

import { useState } from 'react';
import { Volume2, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function WordOfTheDayCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const word = 'resilience';
  const phonetics = '/rɪˈzɪl.jəns/';
  const partOfSpeech = 'noun';
  const meaning = 'Khả năng phục hồi, sự kiên cường vượt qua nghịch cảnh hoặc khó khăn.';
  const example = 'The company showed great resilience during the economic crisis.';
  const exampleVi = 'Công ty đã thể hiện sự kiên cường tuyệt vời trong suốt cuộc khủng hoảng kinh tế.';

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.info('Trình duyệt không hỗ trợ phát âm tự động.');
    }
  };

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className="group relative bg-gradient-to-br from-card via-card to-chart-2/5 border border-border hover:border-chart-2/40 rounded-2xl p-5 sm:p-6 shadow-sm cursor-pointer transition-all duration-300 overflow-hidden select-none"
    >
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-chart-2/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header tags */}
      <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
        <div className="flex items-center gap-1.5 bg-chart-2/10 text-chart-2 border border-chart-2/20 px-2.5 py-1 rounded-md text-[11px] font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TỪ MỚI HÔM NAY</span>
        </div>

        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            setIsFlipped(!isFlipped);
          }}
          className="text-xs text-muted-foreground group-hover:text-foreground flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-full font-medium transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isFlipped ? 'rotate-180' : ''} transition-transform duration-300`} />
          {isFlipped ? 'Mặt trước' : 'Lật xem nghĩa'}
        </button>
      </div>

      {/* Card Content (Flip animation or conditional view) */}
      {!isFlipped ? (
        <div className="py-2 text-center space-y-3 relative z-10">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {partOfSpeech}
            </span>
            <h4 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mt-0.5">
              {word}
            </h4>
            <p className="text-chart-2 font-mono text-sm font-semibold mt-1">
              {phonetics}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSpeak}
              className={`h-9 px-4 rounded-full text-xs font-bold gap-2 bg-background/80 ${
                isPlaying ? 'border-primary text-primary' : ''
              }`}
            >
              <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce text-primary' : 'text-chart-2'}`} />
              Phát âm chuẩn
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-1 space-y-3 relative z-10 animate-in fade-in-50 duration-200">
          <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
            <span className="text-lg font-bold text-chart-2">{word}</span>
            <span className="text-xs text-muted-foreground font-mono">{phonetics}</span>
          </div>

          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Định nghĩa:</div>
            <p className="text-sm font-semibold text-foreground leading-relaxed">
              {meaning}
            </p>
          </div>

          <div className="bg-muted/40 p-3 rounded-xl border border-border/50 space-y-1">
            <div className="text-xs italic text-foreground font-medium">"{example}"</div>
            <div className="text-[11px] text-muted-foreground">→ {exampleVi}</div>
          </div>
        </div>
      )}
    </div>
  );
}
