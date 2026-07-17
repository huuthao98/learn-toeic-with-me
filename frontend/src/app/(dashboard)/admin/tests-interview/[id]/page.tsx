import { AdminTestInterviewDetail } from '@/components/feature/AdminTestDetail';

export default async function AdminTestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminTestInterviewDetail id={id} />;
}
