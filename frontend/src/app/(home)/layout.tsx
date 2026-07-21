import { HomeLayout } from '@/components/layout/HomeLayout';

export default function HomeLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HomeLayout>{children}</HomeLayout>;
}
