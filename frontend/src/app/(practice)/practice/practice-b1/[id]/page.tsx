'use client';

import { useParams, useRouter } from 'next/navigation';
import { useB1 } from '@/hooks/useB1';
import { InteractiveB1Runner } from '@/components/feature/B1Practice/InteractiveB1Runner';
import { getListPracticeB1Route } from '@/constants/routes';

export default function PracticeB1Page() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const { useTestSet, useTestQuestions } = useB1();
  const { data: testSet, isLoading: isTestLoading } = useTestSet(id);
  const { data: questions, isLoading: isQuestionsLoading } = useTestQuestions(id);

  if (isTestLoading || isQuestionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!testSet) {
    return (
      <div className="flex items-center justify-center min-h-screen text-destructive">
        Không tìm thấy đề thi B1.
      </div>
    );
  }
  return (
    <div className="bg-background min-h-screen sm:pt-32 pt-20">
      <InteractiveB1Runner
        testSetId={id}
        questions={questions || []}
        testAudioUrl={testSet.audioUrl || ''}
        isExamMode={false} // Practice mode
        onBack={() => router.push(getListPracticeB1Route('practice'))} // Temporary route to back
      />
    </div>
  );
}
