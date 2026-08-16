import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-card px-6 py-4">
      <div className="min-w-0">
        <h1 className="text-[15px] font-medium leading-6 text-foreground">{title}</h1>
        {description && (
          <p className="mt-0.5 max-w-2xl text-[13px] leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
