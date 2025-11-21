import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="border-b border-slate-900 bg-slate-950">
          <div className="mx-auto max-w-4xl px-4 pt-10 pb-12 md:pt-14 md:pb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-slate-950/80 px-3 py-1 mb-4 text-sm text-emerald-200">
              Careers at Revenuela
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-4">
              Help GTM teams{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400">
                understand their revenue engine
              </span>
              .
            </h1>

            <p className="text-base text-slate-300 mb-6">
              We’re a small, product-led team working on a big problem:
              connecting the tools that run modern GTM teams into one coherent
              view. If you enjoy messy data, sharp strategy and thoughtful UX,
              you’ll feel at home here.
            </p>

            <div className="grid md:grid-cols-3 gap-4 text-sm mb-10">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-slate-400 mb-1">Remote-first</div>
                <p className="text-slate-200">
                  Work from where you’re most productive. We optimise for focus
                  time and deep work.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-slate-400 mb-1">Product - politics</div>
                <p className="text-slate-200">
                  Short feedback loops, real customer conversations and
                  dashboards that show impact.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-slate-400 mb-1">Ownership</div>
                <p className="text-slate-200">
                  Own outcomes, not tickets. Ship meaningful pieces of the
                  revenue OS.
                </p>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-slate-100 mb-3">
              Open roles
            </h2>
            <p className="text-base text-slate-300 mb-4">
              We’re early and still shaping the team. If you don’t see a
              perfect title but the mission resonates, reach out anyway.
            </p>

            <div className="space-y-4 text-sm">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-slate-50">
                    Senior Full-Stack Engineer
                  </h3>
                  <span className="text-xs text-slate-400">Remote · Full-time</span>
                </div>
                <p className="text-slate-300 mb-2">
                  Help design and build the core schema, ingestion pipelines and
                  UX that GTM teams rely on daily.
                </p>
                <ul className="list-disc list-inside text-slate-400">
                  <li>Experience with modern TypeScript/React + backend stack</li>
                  <li>Background in analytics, data models or RevOps a plus</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-slate-50">
                    Founding RevOps / GTM Strategist
                  </h3>
                  <span className="text-xs text-slate-400">Remote · Part/Full-time</span>
                </div>
                <p className="text-slate-300 mb-2">
                  Shape our playbooks, metrics and onboarding experience for GTM
                  teams adopting Revenuela.
                </p>
                <ul className="list-disc list-inside text-slate-400">
                  <li>Hands-on RevOps, growth or sales ops background</li>
                  <li>Comfortable working with customers and product together</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 text-sm text-slate-300">
              Don’t see your role?{" "}
              <a
                href="mailto:hello@revenuela.com"
                className="text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
              >
                Email us your story
              </a>{" "}
              and how you’d like to help.
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
