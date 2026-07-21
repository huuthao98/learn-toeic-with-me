import { ExamEnglishLayout } from '@/components/layout/ExamEnglishLayout';

export default function ExamEnglishLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ExamEnglishLayout>{children}</ExamEnglishLayout>;
}
