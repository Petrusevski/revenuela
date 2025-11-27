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
  mrr: string;
  replyRate?: string;
  meetingRate?: string;
};

type TopWorkflow = {
  id: string;
  label: string;
  mrr: string;
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
// In a real app, you would get this from your Auth Context
const WORKSPACE_ID = "demo-workspace-1"; 

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
          throw new Error(
            "Performance API returned non-JSON response."
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
          err?.message || "Failed to load performance data."
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
  const prospectingCount = summary?.prospectingCount ?? 0;
  const outboundCount = summary?.outboundCount ?? 0;

  return (
    <div>
      <PageHeader
        title="Tool Performance"
        subtitle="Measure how each prospecting and outbound tool contributes to meetings, opportunities, and revenue."
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
            prospectingCount > 0
              ? prospectingTools.map((t) => t.name).join(", ")
              : "No tools connected"
          }
          trendType="neutral"
        />
        <StatCard
          label="Outbound tools measured"
          value={outboundCount.toString()}
          trend={
            outboundCount > 0
              ? outboundTools.map((t) => t.name).join(", ")
              : "No tools connected"
          }
          trendType="neutral"
        />
        <StatCard
          label="Leads influenced (last 30d)"
          value={totalLeadsInfluenced.toLocaleString("de-DE")}
          trend="Based on workspace activity"
          trendType="neutral"
        />
        <StatCard
          label="New MRR from measured workflows"
          value={totalMrrFormatted}
          trend="Summed from closed won deals"
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
            sequences.
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

            {!prospectingTools.length && status === "idle" && (
              <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-[11px] text-slate-500">
                No prospecting tools detected. Connect integrations like Clay or
                Apollo to see their performance here.
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
            Tools that send LinkedIn or email sequences.
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

            {!outboundTools.length && status === "idle" && (
              <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-[11px] text-slate-500">
                No outbound tools detected. Connect integrations like HeyReach
                or Lemlist to see their performance here.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Top workflows */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 mb-4">
        <h2 className="text-sm font-semibold text-slate-100 mb-1">
          Top Performing Workflows
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Workflows evaluated by revenue influence.
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

          {!topWorkflows.length && status === "idle" && (
            <div className="text-[11px] text-slate-500">
              No won deals yet to score workflows.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}