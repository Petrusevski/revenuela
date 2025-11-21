interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
}

export default function StatCard({
  label,
  value,
  trend,
  trendType = "neutral"
}: StatCardProps) {
  const trendColor =
    trendType === "up"
      ? "text-emerald-400"
      : trendType === "down"
      ? "text-rose-400"
      : "text-slate-400";

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-2xl font-semibold text-slate-50">{value}</span>
      {trend && <span className={`text-xs ${trendColor}`}>{trend}</span>}
    </div>
  );
}
