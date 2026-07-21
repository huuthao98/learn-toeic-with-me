'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-6 max-w-lg mx-auto px-4">
        {/* 404 Text */}
        <h1 className="text-[120px] sm:text-[150px] font-extrabold text-primary leading-none tracking-tighter">
          404
        </h1>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Oops! Page Not Found!
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
            It seems like the page you're looking for does not exist or might
            have been removed.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            className="w-full sm:w-auto rounded-lg h-11 px-8 font-medium"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
          <Link
            href={ROUTES.HOME}
            className={cn(
              buttonVariants({ variant: 'default' }),
              'w-full sm:w-auto rounded-lg h-11 px-8 font-medium',
            )}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
