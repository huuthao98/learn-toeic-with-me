import { AdminTestToeicDetail } from '@/components/feature/AdminTestDetail';

export default async function AdminTestToeicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminTestToeicDetail id={id} />;
}
