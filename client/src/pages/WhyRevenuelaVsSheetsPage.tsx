import Header from "../components/Header";
import Footer from "../components/Footer";

export default function WhyRevenuelaVsSheetsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-slate-950 border-b border-slate-900">
          <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 md:pt-14 md:pb-16">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-3">
              Why Revenuela vs spreadsheets
            </h1>
            <p className="text-base text-slate-300 mb-6 max-w-3xl">
              You can hack together a funnel view with exports, VLOOKUPs and
              pivot tables. But it breaks every time your stack changes.
              Revenuela keeps a stable ID and schema while your tools evolve.
            </p>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-slate-300 font-semibold mb-2">
                  With spreadsheets
                </div>
                <ul className="space-y-1 text-slate-400">
                  <li>• Manual exports from each tool every week</li>
                  <li>• VLOOKUPs and duplicates that silently go wrong</li>
                  <li>• No shared definition of “engaged”, “SQL”, “MRR”</li>
                  <li>• One RevOps person becomes the reporting bottleneck</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4">
                <div className="text-emerald-300 font-semibold mb-2">
                  With Revenuela
                </div>
                <ul className="space-y-1 text-slate-200">
                  <li>• Single schema across all GTM tools</li>
                  <li>• Events stream in automatically, stitched by ID</li>
                  <li>• Shared definitions and dashboards by default</li>
                  <li>• RevOps focuses on experiments, not data plumbing</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 text-slate-950 text-sm font-semibold px-4 py-2 shadow-lg shadow-indigo-500/30 hover:opacity-90"
              >
                Create my workspace
                <span className="text-xs">→</span>
              </a>
              <span className="text-slate-400">
                Start with one motion, one tool and one simple dashboard. Grow
                from there.
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
