import Header from "../components/Header";
import Footer from "../components/Footer";

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-slate-950 border-b border-slate-900">
          <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 md:pt-14 md:pb-16">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-3">
              Use cases
            </h1>
            <p className="text-base text-slate-300 mb-6 max-w-3xl">
              If you already use more than two GTM tools (Clay, Apollo, HeyReach,
              Lemlist, CRM, Stripe…), Revenuela becomes the neutral place where
              you <strong>trust the numbers</strong> – and everyone speaks the
              same language.
            </p>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-xs text-sky-300 mb-1">RevOps & Growth</div>
                <p className="text-slate-300 mb-2">
                  You own the stack. You’re tired of spreadsheets and half-truth
                  dashboards.
                </p>
                <ul className="space-y-1 text-slate-400">
                  <li>• Unified reporting across tools & motions</li>
                  <li>• Experiments that are actually measurable</li>
                  <li>• Faster answers to “what should we stop paying for?”</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-xs text-emerald-300 mb-1">
                  Founders & sales leaders
                </div>
                <p className="text-slate-300 mb-2">
                  You want a 1-page view of “what’s working” without logging
                  into every tool.
                </p>
                <ul className="space-y-1 text-slate-400">
                  <li>• High-signal alerts in Revenuela, not noise</li>
                  <li>• Weekly AI summary of your GTM performance</li>
                  <li>• Board-ready views you can screenshot in seconds</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-xs text-fuchsia-300 mb-1">
                  Agencies & consultants
                </div>
                <p className="text-slate-300 mb-2">
                  Run multiple client stacks? Give each a Revenuela workspace
                  and shared language.
                </p>
                <ul className="space-y-1 text-slate-400">
                  <li>• Re-use the same GTM schema across clients</li>
                  <li>• Prove your value with shared dashboards</li>
                  <li>• Standardised reporting across messy client stacks</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 text-sm text-slate-300">
              Not sure where you fit?{" "}
              <a
                href="/contact"
                className="text-cyan-300 underline underline-offset-4"
              >
                Tell us about your stack
              </a>{" "}
              and we’ll suggest a starting use case.
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
