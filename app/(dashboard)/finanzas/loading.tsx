import {
  PageHeaderSkeleton,
  KpiRowSkeleton,
  TableSkeleton,
} from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeaderSkeleton />
      <div className="mb-6">
        <KpiRowSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}
