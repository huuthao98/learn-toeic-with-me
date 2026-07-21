import { PracticeLayout } from '@/components/layout/PracticeLayout';

export default function PracticeLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PracticeLayout>{children}</PracticeLayout>;
}
