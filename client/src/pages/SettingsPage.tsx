import PageHeader from "../components/PageHeader";
import { useSettings } from "../hooks/useSettings";

export default function SettingsPage() {
  const { settings, setSettings, loading, saving, error, saveSettings } =
    useSettings();

  const workspace = settings?.workspace;
  const membership = settings?.membership;

  const updateWorkspace = (patch: Partial<typeof workspace>) => {
    if (!settings || !workspace) return;
    setSettings({
      ...settings,
      workspace: { ...workspace, ...patch },
    });
  };

  const updateMembership = (patch: Partial<typeof membership>) => {
    if (!settings || !membership) return;
    setSettings({
      ...settings,
      membership: { ...membership, ...patch },
    });
  };

  const handleSave = async () => {
    await saveSettings();
  };

if (loading) {
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage workspace details, billing, team access, and GTM preferences."
      />
      <div className="mt-4 text-xs text-slate-400">Loading settings…</div>
    </div>
  );
}

if (error || !workspace || !membership) {
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage workspace details, billing, team access, and GTM preferences."
      />
      <div className="mt-4 rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
        {error || "Failed to load settings."}
      </div>
    </div>
  );
}

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage workspace details, billing, team access, and GTM preferences."
      />

      {error && (
        <div className="mt-3 rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: workspace & billing */}
        <div className="space-y-6 xl:col-span-2">
          {/* Workspace profile */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">
              Workspace profile
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Basic information about your Revenuela workspace. This is used for
              invoices, GTM reports, and shared dashboards.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">
                  Workspace name
                </label>
                <input
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={workspace.workspaceName ?? ""}
                  onChange={(e) =>
                    updateWorkspace({ workspaceName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">
                  Company / Brand
                </label>
                <input
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={workspace.companyName ?? ""}
                  onChange={(e) =>
                    updateWorkspace({ companyName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Primary domain</label>
                <input
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={workspace.primaryDomain ?? ""}
                  onChange={(e) =>
                    updateWorkspace({ primaryDomain: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">
                  Default currency
                </label>
                <select
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={workspace.defaultCurrency}
                  onChange={(e) =>
                    updateWorkspace({ defaultCurrency: e.target.value })
                  }
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Timezone</label>
                <select
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={workspace.timezone}
                  onChange={(e) =>
                    updateWorkspace({ timezone: e.target.value })
                  }
                >
                  <option value="Europe/Prague">Europe/Prague (GMT+1)</option>
                  <option value="Europe/Berlin">Europe/Berlin (GMT+1)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">
                  Industry (for benchmarks)
                </label>
                <select
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={workspace.industry}
                  onChange={(e) =>
                    updateWorkspace({ industry: e.target.value })
                  }
                >
                  <option value="SaaS">SaaS</option>
                  <option value="Fintech">Fintech</option>
                  <option value="Agency / Services">Agency / Services</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 text-xs font-medium text-white disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </section>

          {/* Billing & plan */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">
              Billing & plan
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Manage your Revenuela subscription, seats, and invoices. (Connect
              to Stripe or Paddle later.)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-3">
                <div className="text-slate-400 mb-1">Current plan</div>
                <div className="text-slate-100 font-semibold">
                  {workspace.plan === "pro" ? "Pro (Beta)" : workspace.plan}
                </div>
                <div className="text-slate-400 mt-1">
                  Up to {workspace.seatsTotal} seats,{" "}
                  {workspace.seatsUsed} used.
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-3">
                <div className="text-slate-400 mb-1">Seats</div>
                <div className="text-slate-100 font-semibold">
                  {workspace.seatsUsed} of {workspace.seatsTotal} used
                </div>
                <div className="text-slate-400 mt-1">
                  Invite GTM, RevOps, and founders.
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-3">
                <div className="text-slate-400 mb-1">Billing email</div>
                <input
                  className="w-full mt-1 rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                  value={workspace.billingEmail ?? ""}
                  onChange={(e) =>
                    updateWorkspace({ billingEmail: e.target.value })
                  }
                  placeholder="billing@company.com"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-100">
                Manage subscription
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs text-slate-200">
                View invoices
              </button>
            </div>
          </section>

          {/* Team & roles (static demo) */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">
              Team & roles
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Control who has access to Revenuela and what they can change.
              Later you can sync this with your identity provider.
            </p>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
              <table className="min-w-full">
                <thead className="bg-slate-950/80">
                  <tr>
                    <th className="text-left px-3 py-2 text-slate-400 font-normal">
                      Member
                    </th>
                    <th className="text-left px-3 py-2 text-slate-400 font-normal">
                      Role
                    </th>
                    <th className="text-left px-3 py-2 text-slate-400 font-normal">
                      Billing owner
                    </th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-800/80">
                    <td className="px-3 py-2 text-slate-100">
                      Current user (you)
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-1 rounded-full bg-slate-800 text-slate-100 text-[11px]">
                        {membership.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      {membership.isBillingOwner ? "Yes" : "No"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button className="text-slate-400 hover:text-slate-100 text-[11px]">
                        (Manage later)
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex justify-between items-center text-xs">
              <span className="text-slate-400">
                Roles idea: <span className="text-slate-200">Owner</span>,{" "}
                <span className="text-slate-200">Admin</span>,{" "}
                <span className="text-slate-200">Analyst</span>,{" "}
                <span className="text-slate-200">Read-only</span>.
              </span>
              <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-100">
                Invite member
              </button>
            </div>
          </section>
        </div>

        {/* Right column: preferences, API, data */}
        <div className="space-y-6">
          {/* Preferences */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">
              Preferences
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Choose how Revenuela looks and when it should notify you.
            </p>

            <div className="space-y-3 text-xs">
              {/* Dark mode */}
              <button
                type="button"
                onClick={() =>
                  updateMembership({ darkMode: !membership.darkMode })
                }
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900"
              >
                <span>
                  Dark mode interface
                  <span className="block text-[11px] text-slate-500">
                    Revenuela is designed for dark. You can add light mode
                    later.
                  </span>
                </span>
                <span
                  className={`inline-flex h-5 w-9 items-center rounded-full transition ${
                    membership.darkMode ? "bg-indigo-500" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white transform transition ${
                      membership.darkMode ? "translate-x-4" : "translate-x-1"
                    }`}
                  />
                </span>
              </button>

              {/* Weekly digest */}
              <button
                type="button"
                onClick={() =>
                  updateMembership({ weeklyDigest: !membership.weeklyDigest })
                }
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900"
              >
                <span>
                  Weekly GTM performance digest
                  <span className="block text-[11px] text-slate-500">
                    Email summary of revenue, tool performance and top workflows.
                  </span>
                </span>
                <span
                  className={`inline-flex h-5 w-9 items-center rounded-full transition ${
                    membership.weeklyDigest ? "bg-indigo-500" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white transform transition ${
                      membership.weeklyDigest
                        ? "translate-x-4"
                        : "translate-x-1"
                    }`}
                  />
                </span>
              </button>

              {/* Performance alerts */}
              <button
                type="button"
                onClick={() =>
                  updateMembership({
                    performanceAlerts: !membership.performanceAlerts,
                  })
                }
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900"
              >
                <span>
                  Performance alerts
                  <span className="block text-[11px] text-slate-500">
                    Get alerts when reply rate drops or a workflow suddenly
                    underperforms.
                  </span>
                </span>
                <span
                  className={`inline-flex h-5 w-9 items-center rounded-full transition ${
                    membership.performanceAlerts
                      ? "bg-indigo-500"
                      : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white transform transition ${
                      membership.performanceAlerts
                        ? "translate-x-4"
                        : "translate-x-1"
                    }`}
                  />
                </span>
              </button>
            </div>
          </section>

          {/* API & IDs */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">
              API & IDs
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Configure how Revenuela IDs are generated and how external tools
              talk to your workspace.
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">
                  Revenuela ID prefix
                </label>
                <input
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={workspace.revenuelaIdPrefix}
                  onChange={(e) =>
                    updateWorkspace({ revenuelaIdPrefix: e.target.value })
                  }
                />
                <p className="text-[11px] text-slate-500">
                  Example:{" "}
                  <span className="text-slate-200">RVN-LEAD-9F3A2C</span>.
                  Use this prefix when passing IDs into Clay, Apollo, HeyReach,
                  etc.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">
                  Public API key (read-only analytics)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100 font-mono truncate"
                    value={workspace.publicApiKey}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(workspace.publicApiKey)
                    }
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-100"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Use this for dashboards or internal BI that only need
                  aggregated analytics.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">
                  Webhook endpoint (events in)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100 font-mono truncate"
                    value={workspace.webhookEndpoint}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(workspace.webhookEndpoint)
                    }
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-100"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Connect outbound tools (HeyReach, Lemlist, Instantly…) to send
                  replies, meetings and deal events back to Revenuela.
                </p>
              </div>
            </div>
          </section>

          {/* Data & privacy */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">
              Data & privacy
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Control how long data is kept and how much PII Revenuela should
              store in its analytics layer.
            </p>

            <div className="space-y-3 text-xs">
              <button
                type="button"
                onClick={() =>
                  updateWorkspace({
                    dataAnonymization: !workspace.dataAnonymization,
                  })
                }
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900"
              >
                <span>
                  Anonymize personal data in analytics
                  <span className="block text-[11px] text-slate-500">
                    Store emails and names only as hashed IDs in reports.
                  </span>
                </span>
                <span
                  className={`inline-flex h-5 w-9 items-center rounded-full transition ${
                    workspace.dataAnonymization
                      ? "bg-indigo-500"
                      : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white transform transition ${
                      workspace.dataAnonymization
                        ? "translate-x-4"
                        : "translate-x-1"
                    }`}
                  />
                </span>
              </button>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">
                  Data retention for raw events
                </label>
                <select
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={workspace.dataRetentionMonths}
                  onChange={(e) =>
                    updateWorkspace({
                      dataRetentionMonths: Number(e.target.value),
                    })
                  }
                >
                  <option value={12}>12 months</option>
                  <option value={6}>6 months</option>
                  <option value={3}>3 months</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  Aggregated metrics can still be kept longer for historical
                  trends.
                </p>
              </div>

              <button className="w-full mt-2 px-3 py-2 rounded-lg bg-slate-900 border border-rose-500/40 text-[11px] text-rose-300 hover:bg-rose-500/10">
                Request workspace export / deletion
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-2 px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 text-[11px] font-medium text-white disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Save all settings"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
