'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />;
}

export function PostSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="w-32 h-3" />
          <Skeleton className="w-20 h-2" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-3/4 h-3" />
        <Skeleton className="w-1/2 h-3" />
      </div>
      <Skeleton className="w-full h-48 rounded-xl" />
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-4">
          <Skeleton className="w-16 h-8 rounded-lg" />
          <Skeleton className="w-16 h-8 rounded-lg" />
          <Skeleton className="w-16 h-8 rounded-lg" />
        </div>
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl overflow-hidden">
        <Skeleton className="h-48 w-full" />
        <div className="px-6 pb-6">
          <div className="flex items-end -mt-12 mb-4">
            <Skeleton className="w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-800" />
          </div>
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <Skeleton className="w-48 h-6" />
              <Skeleton className="w-32 h-4" />
            </div>
            <Skeleton className="w-28 h-10 rounded-xl" />
          </div>
          <Skeleton className="w-full h-4 mt-3" />
          <div className="flex gap-6 mt-4">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-20 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}
