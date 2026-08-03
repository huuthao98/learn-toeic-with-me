import { Suspense } from 'react';
import { CreateTestForm } from '@/components/feature/CreateTestForm';

export default function CreateTestPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-background">
          <div className="h-10 bg-secondary/80 animate-pulse rounded w-32" />
        </div>
      }
    >
      <CreateTestForm />
    </Suspense>
  );
}
