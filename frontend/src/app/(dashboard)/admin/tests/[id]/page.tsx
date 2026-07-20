import { AdminTestVocabularyDetail } from '@/components/feature/AdminTestDetail';

export default async function AdminTestVocabularyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminTestVocabularyDetail id={id} />;
}
