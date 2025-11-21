import PageHeader from "../components/PageHeader";

export default function AccountsPage() {
  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Manage all customer and prospect accounts in one place."
      />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        <p>This is a placeholder for the accounts view. You can extend it with tables, filters, and detail panels.</p>
      </div>
    </div>
  );
}
