import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-6 py-14 text-center">
      <p className="text-[14px] font-medium text-foreground">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-[13px] leading-5 text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
