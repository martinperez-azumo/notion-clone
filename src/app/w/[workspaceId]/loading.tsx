export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-14 pt-16" aria-busy aria-label="Loading">
      <div className="h-9 w-1/2 animate-pulse rounded bg-muted" />
      <div className="mt-10 flex flex-col gap-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
