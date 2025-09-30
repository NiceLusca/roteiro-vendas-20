import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonCard() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>

            {/* Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-36" />
            </div>

            {/* Details */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonLeadsList({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
