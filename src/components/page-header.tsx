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
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-background px-8 py-6">
      <div className="min-w-0">
        {/* DH-9: Anton para títulos grandes, en mayúsculas; solo tiene peso 400. */}
        <h1 className="font-display text-[30px] font-normal uppercase leading-[1.1] text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[13.5px] leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </header>
  );
}
