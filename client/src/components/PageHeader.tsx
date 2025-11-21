interface PageHeaderProps {
  title: string;
  subtitle?: string;
  primaryActionLabel?: string;
  onPrimaryActionClick?: () => void;
}

export default function PageHeader({
  title,
  subtitle,
  primaryActionLabel,
  onPrimaryActionClick
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-50">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
      {primaryActionLabel && (
        <button
          onClick={onPrimaryActionClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/30"
        >
          <span>＋</span>
          <span>{primaryActionLabel}</span>
        </button>
      )}
    </div>
  );
}
