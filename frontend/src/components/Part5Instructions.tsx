export function Part5Instructions() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-lg overflow-hidden animate-fade-in">
      {/* Reading Test Header */}
      <div className="bg-foreground text-background px-6 py-4">
        <h2 className="text-lg font-black uppercase tracking-widest">Reading Test</h2>
      </div>

      <div className="px-6 py-5 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>
          In the Reading test, you will read a variety of texts and answer several different types
          of reading comprehension questions. The entire Reading test will last{' '}
          <strong>75 minutes</strong>. There are three parts, and directions are given for each
          part. You are encouraged to answer as many questions as possible within the time allowed.
        </p>
        <p>
          You must mark your answers on the separate answer sheet. Do not write your answers in your
          test book.
        </p>

        {/* Divider */}
        <div className="h-px bg-border/60" />

        {/* Part 5 */}
        <div className="space-y-3">
          <h3 className="text-base font-black uppercase tracking-wider text-foreground">Part 5</h3>
          <p>
            <strong>Directions:</strong> A word or phrase is missing in each of the sentences below.
            Four answer choices are given below each sentence. Select the best answer to complete
            the sentence. Then mark the letter (A), (B), (C), or (D) on your answer sheet.
          </p>
        </div>
      </div>
    </div>
  );
}
