import {
  PageHeaderSkeleton,
  PropertyGridSkeleton,
} from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeaderSkeleton />
      <div className="mb-6 flex flex-wrap gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-7 w-20 animate-pulse rounded-full bg-muted/60"
          />
        ))}
      </div>
      <PropertyGridSkeleton />
    </div>
  );
}
