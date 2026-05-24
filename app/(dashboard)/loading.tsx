import {
  PageHeaderSkeleton,
  KpiRowSkeleton,
  ListSkeleton,
} from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeaderSkeleton />
      <KpiRowSkeleton />
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <ListSkeleton rows={4} />
        </div>
        <div className="space-y-2">
          <ListSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}
