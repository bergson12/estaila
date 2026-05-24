import { cn } from "@/lib/utils";

export function Sk({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60",
        className
      )}
    />
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Sk className="aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-4">
        <Sk className="h-3.5 w-3/4" />
        <Sk className="h-6 w-1/2" />
        <Sk className="h-3 w-2/3" />
        <div className="flex gap-2 pt-3">
          <Sk className="h-3 w-10" />
          <Sk className="h-3 w-10" />
          <Sk className="h-3 w-10" />
          <Sk className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <Sk className="h-11 w-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <Sk className="h-3.5 w-1/3" />
        <Sk className="h-3 w-1/4" />
      </div>
      <Sk className="h-6 w-20" />
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <Sk className="h-3 w-20" />
        <Sk className="h-3.5 w-3.5 rounded-sm" />
      </div>
      <Sk className="mt-3 h-7 w-1/2" />
      <Sk className="mt-1.5 h-2.5 w-1/3" />
    </div>
  );
}

export function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <KpiSkeleton key={i} />
      ))}
    </div>
  );
}

export function KanbanSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <div className="grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4">
      {Array.from({ length: cols }).map((_, c) => (
        <div
          key={c}
          className="flex flex-col rounded-xl border border-border bg-card/40"
        >
          <div className="border-b border-border p-3">
            <Sk className="h-4 w-24" />
          </div>
          <div className="space-y-2 p-2 min-h-[300px]">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-3"
              >
                <Sk className="h-3 w-2/3" />
                <Sk className="mt-2 h-3 w-1/3" />
                <Sk className="mt-3 h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-card/50 p-3">
        <Sk className="h-3 w-24" />
      </div>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-6 items-center gap-4 border-b border-border p-4 last:border-0"
          >
            <Sk className="col-span-2 h-3.5" />
            <Sk className="h-3" />
            <Sk className="h-3" />
            <Sk className="h-3" />
            <Sk className="ml-auto h-3.5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Sk className="h-7 w-48" />
        <Sk className="h-3.5 w-72" />
      </div>
      <Sk className="h-9 w-32" />
    </div>
  );
}
