import Header from "../components/Header";
import Footer from "../components/Footer";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="border-b border-slate-900 bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 md:pt-14 md:pb-16">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-3">
              How Revenuela works
            </h1>
            <p className="text-base text-slate-300 mb-6 max-w-3xl">
              Revenuela is not another CRM or sequencing tool. It’s the{" "}
              <span className="font-medium text-slate-100">one schema</span>{" "}
              that connects all your GTM tools, using a unique Revenuela ID to
              track performance end-to-end. Connect once, and every motion
              starts writing to the same source of truth.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-600 transition-colors">
                <div className="text-xs text-indigo-300 mb-1">Step 1</div>
                <h2 className="text-base font-semibold mb-2">
                  Connect your prospecting & outbound tools
                </h2>
                <p className="text-sm text-slate-400 mb-3">
                  Clay, Apollo, ZoomInfo, HeyReach, Lemlist, Instantly & more.
                  They keep doing what they do best – Revenuela just listens to
                  imports and outcomes.
                </p>
                <ul className="space-y-1 text-sm text-slate-300">
                  <li>• Webhooks or API keys – no forwarding of credentials.</li>
                  <li>• Every imported contact gets a Revenuela ID.</li>
                  <li>• No campaign logic moved out of native tools.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-600 transition-colors">
                <div className="text-xs text-cyan-300 mb-1">Step 2</div>
                <h2 className="text-base font-semibold mb-2">
                  Follow each ID through the GTM funnel
                </h2>
                <p className="text-sm text-slate-400 mb-3">
                  Revenuela sits in the middle and receives events from tools
                  you already use – from first import to invoice paid.
                </p>
                <ul className="space-y-1 text-sm text-slate-300">
                  <li>• Imports → replies → meetings → pipeline → revenue.</li>
                  <li>• Zero duplicate logic: tools push events, not states.</li>
                  <li>• Flexible mapping per workspace and per tool.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-600 transition-colors">
                <div className="text-xs text-emerald-300 mb-1">Step 3</div>
                <h2 className="text-base font-semibold mb-2">
                  Compare tools & motions side-by-side
                </h2>
                <p className="text-sm text-slate-400 mb-3">
                  Every chart and KPI on the dashboard is powered by stitched
                  Revenuela IDs, not manual exports.
                </p>
                <ul className="space-y-1 text-sm text-slate-300">
                  <li>• Understand which tools actually create revenue.</li>
                  <li>
                    • See which motion breaks – prospecting, outbound or CRM.
                  </li>
                  <li>• Let AI explain how to improve each motion.</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 text-sm text-slate-300">
              Ready to see it with your own stack?{" "}
              <a
                href="/contact"
                className="text-cyan-300 underline underline-offset-4"
              >
                Book a live walkthrough
              </a>{" "}
              or{" "}
              <a
                href="/signup"
                className="text-emerald-300 underline underline-offset-4"
              >
                start a 30-day free trial
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
