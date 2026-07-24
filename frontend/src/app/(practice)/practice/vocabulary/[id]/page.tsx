'use client';

import { CasualQuizRunner } from '@/components/feature/VocabularyPractice/CasualQuizRunner';
import { useRouter, useSearchParams } from 'next/navigation';
import { use } from 'react';

export default function PracticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') as 'practice' | 'exam') || 'practice';

  return (
    <CasualQuizRunner 
      testSetId={id} 
      mode={mode}
      onBack={() => router.push('/practice/vocabulary')}
      onRestart={() => window.location.reload()}
    />
  );
}
