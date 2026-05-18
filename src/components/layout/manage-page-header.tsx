interface ManagePageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function ManagePageHeader({
  title,
  subtitle,
  actions,
}: ManagePageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 px-6 py-5 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
    </header>
  );
}
