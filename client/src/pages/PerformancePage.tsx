import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { API_BASE_URL } from "../../config";

type ToolPerf = {
  id: string;
  name: string;
  category: "Prospecting" | "Outbound";
  role: string;
  leadsInfluenced: number;
  customersWon: number;
  mrr: string; // already formatted, e.g. "€3,950"
  replyRate?: string;
  meetingRate?: string;
};

type TopWorkflow = {
  id: string;
  label: string;
  mrr: string; // formatted
  customers: number;
  summary: string;
};

type PerformanceSummary = {
  prospectingCount: number;
  outboundCount: number;
  totalLeadsInfluenced: number;
  totalMrrFormatted: string;
};

type PerformanceApiResponse = {
  tools: ToolPerf[];
  summary: PerformanceSummary;
  topWorkflows: TopWorkflow[];
};

const API_BASE = API_BASE_URL;
const WORKSPACE_ID = "demo-workspace-1"; // TODO: replace with real workspace id

export default function PerformancePage() {
  const [tools, setTools] = useState<ToolPerf[]>([]);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [topWorkflows, setTopWorkflows] = useState<TopWorkflow[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const res = await fetch(
          `${API_BASE}/api/performance?workspaceId=${encodeURIComponent(
            WORKSPACE_ID
          )}`
        );

        const contentType = res.headers.get("Content-Type") || "";

        if (!res.ok) {
          let message = `Performance API error (${res.status})`;

          try {
            if (contentType.includes("application/json")) {
              const errJson = await res.json();
              if (errJson && typeof errJson.error === "string") {
                message = errJson.error;
              }
            } else {
              const text = await res.text();
              if (text && text.trim().length > 0) {
                message = text.slice(0, 200);
              }
            }
          } catch {
            // ignore parsing errors
          }

          throw new Error(message);
        }

        if (!contentType.includes("application/json")) {
          const text = await res.text();
          console.error("Performance API returned non-JSON:", text);
          throw new Error(
            "Performance API returned non-JSON response. Check that /api/performance returns JSON."
          );
        }

        const json: PerformanceApiResponse = await res.json();
        setTools(json.tools || []);
        setSummary(json.summary || null);
        setTopWorkflows(json.topWorkflows || []);
        setStatus("idle");
      } catch (err: any) {
        console.error("Failed to load performance:", err);
        setErrorMessage(
          err?.message ||
            "Failed to load performance data. Check that the backend /api/performance route is running."
        );
        setStatus("error");
      }
    };

    fetchPerformance();
  }, []);

  const prospectingTools = useMemo(
    () => tools.filter((t) => t.category === "Prospecting"),
    [tools]
  );
  const outboundTools = useMemo(
    () => tools.filter((t) => t.category === "Outbound"),
    [tools]
  );

  const totalLeadsInfluenced = summary?.totalLeadsInfluenced ?? 0;
  const totalMrrFormatted = summary?.totalMrrFormatted ?? "€0";
  const prospectingCount = summary?.prospectingCount ?? prospectingTools.length;
  const outboundCount = summary?.outboundCount ?? outboundTools.length;

  return (
    <div>
      <PageHeader
        title="Tool Performance"
        subtitle="Measure how each prospecting and outbound tool contributes to meetings, opportunities, and revenue — using Revenuela IDs as the common key."
      />

      {status === "loading" && !tools.length && (
        <div className="mt-2 mb-3 text-xs text-slate-400">
          Loading tool performance…
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="mt-2 mb-3 rounded-md border border-rose-700 bg-rose-900/40 px-3 py-2 text-[11px] text-rose-100">
          {errorMessage}
        </div>
      )}

      {/* Top summary stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-2">
        <StatCard
          label="Prospecting tools measured"
          value={prospectingCount.toString()}
          trend={
            prospectingTools.length
              ? prospectingTools.map((t) => t.name).join(", ")
              : "Awaiting data"
          }
          trendType="neutral"
        />
        <StatCard
          label="Outbound tools measured"
          value={outboundCount.toString()}
          trend={
            outboundTools.length
              ? outboundTools.map((t) => t.name).join(", ")
              : "Awaiting data"
          }
          trendType="neutral"
        />
        <StatCard
          label="Leads influenced (last 30d)"
          value={totalLeadsInfluenced.toLocaleString("de-DE")}
          trend="Approximation based on workspace activity"
          trendType="neutral"
        />
        <StatCard
          label="New MRR from measured workflows"
          value={totalMrrFormatted}
          trend="Summed from closed won deals in this workspace"
          trendType="up"
        />
      </section>

      {/* Breakdown by category */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Prospecting tools */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-1">
            Prospecting tools
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Tools that discover and enrich leads before they enter outbound
            sequences. Revenuela measures how many of their IDs eventually
            become customers.
          </p>

          <div className="space-y-3 text-xs">
            {prospectingTools.map((tool) => (
              <div
                key={tool.id}
                className="rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-[11px] font-semibold text-slate-100">
                      {tool.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-slate-100">
                        {tool.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {tool.role}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-300">
                    <div>MRR {tool.mrr}</div>
                    <div className="text-slate-500">
                      {tool.customersWon} customers
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>
                    {tool.leadsInfluenced.toLocaleString("de-DE")} leads
                    influenced
                  </span>
                  {tool.meetingRate && (
                    <span className="text-slate-500">
                      Meeting rate: {tool.meetingRate}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {!prospectingTools.length && (
              <div className="text-[11px] text-slate-500">
                No prospecting tools detected yet. Once integrations like Clay
                or Apollo are connected and used, they will show up here.
              </div>
            )}
          </div>
        </div>

        {/* Outbound tools */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-1">
            Outbound tools
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Tools that send LinkedIn or email sequences. Revenuela measures
            replies, meetings, and revenue for IDs that touch each tool.
          </p>

          <div className="space-y-3 text-xs">
            {outboundTools.map((tool) => (
              <div
                key={tool.id}
                className="rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-[11px] font-semibold text-slate-100">
                      {tool.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-slate-100">
                        {tool.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {tool.role}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-300">
                    <div>MRR {tool.mrr}</div>
                    <div className="text-slate-500">
                      {tool.customersWon} customers
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>
                    {tool.leadsInfluenced.toLocaleString("de-DE")} leads
                    influenced
                  </span>
                  <span className="text-slate-500">
                    {tool.replyRate && `Replies: ${tool.replyRate} · `}
                    {tool.meetingRate && `Meetings: ${tool.meetingRate}`}
                  </span>
                </div>
              </div>
            ))}

            {!outboundTools.length && (
              <div className="text-[11px] text-slate-500">
                No outbound tools detected yet. Once integrations like HeyReach
                or Lemlist are connected and used, they will show up here.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Top workflows (summary) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 mb-4">
        <h2 className="text-sm font-semibold text-slate-100 mb-1">
          Top 5 best-performing workflows
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Workflows are evaluated by the revenue they influence and how
          efficiently they move Revenuela IDs from prospecting to closed won.
        </p>

        <div className="space-y-3 text-xs">
          {topWorkflows.map((wf) => (
            <div
              key={wf.id}
              className="rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-100">{wf.label}</span>
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px]">
                  {wf.mrr} · {wf.customers} customers
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{wf.summary}</p>
            </div>
          ))}

          {!topWorkflows.length && (
            <div className="text-[11px] text-slate-500">
              No workflows scored yet. Once workflows produce opportunities and
              closed won deals, the best performers will appear here.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
