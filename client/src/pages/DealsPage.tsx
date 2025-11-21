import PageHeader from "../components/PageHeader";

export default function DealsPage() {
  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle="Track revenue opportunities across your pipelines."
      />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        <p>This is a placeholder for the deals view. You can extend it with tables, filters, and detail panels.</p>
      </div>
    </div>
  );
}
