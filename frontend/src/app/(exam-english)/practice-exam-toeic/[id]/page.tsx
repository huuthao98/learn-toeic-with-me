'use client';

import { useParams, useRouter } from 'next/navigation';

import { useToeic } from '@/hooks/useToeic';
import { InteractiveToeicRunner } from '@/components/feature/ToeicPractice/InteractiveToeicRunner';
import { getListPracticeToeicRoute } from '@/constants/routes';

export default function PracticeInteractivePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // API hooks
  const { useTestSet, useTestQuestions } = useToeic();
  const { data: testSet, isLoading: isTestLoading } = useTestSet(id);
  const { data: questions, isLoading: isQuestionsLoading } =
    useTestQuestions(id);

  if (isTestLoading || isQuestionsLoading) {
    return (
      <div className="p-8 text-center bg-slate-200/50 dark:bg-slate-800/50">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!testSet) {
    return (
      <div className="p-8 text-center text-red-500 bg-slate-200/50 dark:bg-slate-800/50">
        Không tìm thấy đề thi.
      </div>
    );
  }

  const sortedQuestions = [...(questions || [])].sort(
    (a, b) => a.questionNumber - b.questionNumber,
  );

  return (
    <InteractiveToeicRunner
      testSetId={id}
      questions={sortedQuestions.filter(q =>
        ['3', '4', '5', '6', '7'].includes(q.part),
      )}
      onBack={() => router.push(getListPracticeToeicRoute('practice'))}
    />
  );
}
