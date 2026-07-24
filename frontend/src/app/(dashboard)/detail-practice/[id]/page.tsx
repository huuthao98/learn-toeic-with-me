import { AdminTestPracticeDetail } from '@/components/feature/AdminTestDetail';

export default async function AdminTestPracticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminTestPracticeDetail id={id} />;
}
