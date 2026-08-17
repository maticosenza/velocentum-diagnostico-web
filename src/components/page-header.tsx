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
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-card px-8 py-6">
      <div className="min-w-0">
        <h1 className="text-[19px] font-medium leading-7 tracking-[-0.01em] text-foreground">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </header>
  );
}
