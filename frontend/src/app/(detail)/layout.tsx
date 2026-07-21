import { DetailLayout } from '@/components/layout/DetailLayout';

export default function DetailLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <DetailLayout>{children}</DetailLayout>;
}
