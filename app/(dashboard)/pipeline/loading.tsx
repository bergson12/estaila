import {
  PageHeaderSkeleton,
  KanbanSkeleton,
} from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <PageHeaderSkeleton />
      <KanbanSkeleton />
    </div>
  );
}
