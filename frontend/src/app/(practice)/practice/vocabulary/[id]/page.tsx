import { PracticeVocabularyRunner } from '@/components/feature/PracticeTestRunner';

export default async function PracticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PracticeVocabularyRunner id={id} />;
}
