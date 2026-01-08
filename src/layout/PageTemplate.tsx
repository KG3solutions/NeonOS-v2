interface PageTemplateProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageTemplate({ title, children, actions }: PageTemplateProps) {
  return (
    <div className="flex-1 p-6 lg:p-8 overflow-auto bg-slate-950/50">
      {/* Page Header - Industrial style */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 led-indicator" />
          <h1 className="text-2xl font-mono text-blue-400 tracking-widest font-bold uppercase">
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>

      {/* Page Content - with max-width for readability */}
      <div className="max-w-7xl space-y-8">
        {children}
      </div>
    </div>
  );
}
