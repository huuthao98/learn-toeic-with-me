'use client';

import examplePart1 from '@/assets/img/example-part1.png';

interface ListeningInstructionsProps {
  onStart: () => void;
}

export function ListeningInstructions({ onStart }: ListeningInstructionsProps) {
  return (
    <div className="max-w-7xl rounded-2xl border border-border/60 bg-card shadow-lg overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-foreground text-background px-6 py-4">
        <h2 className="text-lg font-black uppercase tracking-widest">Listening Test</h2>
      </div>

      <div className="px-6 py-5 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>
          In the Listening test, you will be asked to demonstrate how well you understand spoken
          English. The entire Listening test will last approximately <strong>45 minutes</strong>.
          There are four parts, and directions are given for each part. You must mark your answers
          on the separate answer sheet. Do not write your answers in your test book.
        </p>

        {/* Divider */}
        <div className="h-px bg-border/60" />

        {/* Part 1 Instructions */}
        <div className="space-y-3">
          <h3 className="text-base font-black uppercase tracking-wider">Part 1</h3>
          <p>
            <strong>Directions:</strong> For each question in this part, you will hear four
            statements about a picture in your test book. When you hear the statements, you must
            select the one statement that best describes what you see in the picture. Then find the
            number of the question on your answer sheet and mark your answer. The statements will
            not be printed in your test book and will be spoken only one time.
          </p>
        </div>

        {/* Example image — static TOEIC example */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-full max-w-md rounded-xl overflow-hidden border border-border/40 shadow-sm bg-secondary/20">
            <img src={examplePart1.src} alt="Example — Part 1" className="w-full object-contain" />
          </div>
          <p className="text-xs text-muted-foreground italic text-center max-w-md">
            Statement (C), &ldquo;They&apos;re sitting at a table,&rdquo; is the best description of
            the picture, so you should select answer (C) and mark it on your answer sheet.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-5 flex justify-end">
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
        >
          Bắt đầu làm bài
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
