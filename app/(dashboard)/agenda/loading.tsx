import { PageHeaderSkeleton, ListSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeaderSkeleton />
      <ListSkeleton />
    </div>
  );
}
