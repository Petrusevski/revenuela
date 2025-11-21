import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function DashboardsKpisPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="border-b border-slate-900 bg-slate-950/90">
          <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 md:pt-14 md:pb-16">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-3">
              Dashboards & KPIs
            </h1>
            <p className="text-base text-slate-300 mb-6 max-w-3xl">
              Revenuela ships with opinionated GTM KPIs out of the box – focused
              on <strong>stages</strong>, <strong>tools</strong> and{" "}
              <strong>success rates</strong>, not vanity metrics. See exactly
              where revenue is created or lost.
            </p>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-slate-400 mb-1">Stage KPIs</div>
                <div className="text-2xl font-semibold text-slate-50 mb-1">
                  23%
                  <span className="text-sm text-slate-400 ml-1">win rate</span>
                </div>
                <p className="text-slate-400 mb-3">
                  Won vs lost for all Revenuela IDs that reached proposal. See
                  where exactly your funnel leaks.
                </p>
                <ul className="space-y-1 text-slate-300">
                  <li>• Prospecting → Engaged → Meeting → Proposal → Won</li>
                  <li>• Stage-by-stage conversion per tool & motion</li>
                  <li>• Trendlines by week, owner and segment</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-slate-400 mb-1">Tool comparison</div>
                <div className="text-2xl font-semibold text-slate-50 mb-1">
                  +18%
                  <span className="text-sm text-emerald-400 ml-1">
                    HeyReach vs email
                  </span>
                </div>
                <p className="text-slate-400 mb-3">
                  Compare reply, meeting and win rates for Clay + HeyReach vs
                  Apollo + email vs inbound.
                </p>
                <ul className="space-y-1 text-slate-300">
                  <li>• Which tools justify their subscription?</li>
                  <li>• Where do we waste sequences on bad lists?</li>
                  <li>• Motion-level benchmarks you can share with the team</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-slate-400 mb-1">Revenue lens</div>
                <div className="text-2xl font-semibold text-slate-50 mb-1">
                  €7.9k
                  <span className="text-sm text-slate-400 ml-1">
                    MRR last 30 days
                  </span>
                </div>
                <p className="text-slate-400 mb-3">
                  Revenue is stitched all the way back to the originating
                  prospecting source and outbound engine.
                </p>
                <ul className="space-y-1 text-slate-300">
                  <li>• Motion-level MRR (Outbound, Inbound, PLG, Partners)</li>
                  <li>• Cohorts by first touch tool & segment</li>
                  <li>• Churn and expansion mapped back to original motion</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 text-sm text-slate-300">
              Want to see your own funnel in this view?{" "}
              <a
                href="/contact"
                className="text-cyan-300 underline underline-offset-4"
              >
                Talk to us
              </a>{" "}
              or{" "}
              <a
                href="/signup"
                className="text-emerald-300 underline underline-offset-4"
              >
                spin up a workspace in minutes
              </a>
              .
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
