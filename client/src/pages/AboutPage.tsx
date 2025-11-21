import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="border-b border-slate-900 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.25),_transparent_55%)]">
          <div className="mx-auto max-w-4xl px-4 pt-10 pb-12 md:pt-14 md:pb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-slate-950/80 px-3 py-1 mb-4 text-sm text-indigo-200">
              About Revenuela
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-4">
              We’re building the revenue OS{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400">
                GTM teams wish their CRM had
              </span>
              .
            </h1>

            <p className="text-base text-slate-300 mb-6">
              Revenuela was born from a simple frustration: every GTM team we
              worked with had great tools, but no shared view of{" "}
              <span className="font-medium text-slate-100">
                what actually creates revenue
              </span>
              . Data was fragmented across Clay, outbound tools, CRMs,
              billing systems and spreadsheets.
            </p>

            <p className="text-base text-slate-300 mb-4">
              Instead of building yet another CRM or sequencing tool, we
              decided to build{" "}
              <span className="font-medium text-slate-100">
                one neutral schema
              </span>{" "}
              that all GTM tools can write to. One Revenuela ID follows each
              prospect, account and deal from first list import to paid invoice.
            </p>

            <p className="text-base text-slate-300 mb-4">
              Our goal is to give RevOps, founders and sales leaders a place
              where they can finally{" "}
              <span className="font-medium text-slate-100">
                trust the numbers
              </span>{" "}
              – without asking somebody to “just pull one more spreadsheet”
              before every meeting.
            </p>

            <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-slate-400 mb-1">What we believe</div>
                <p className="text-slate-200">
                  Tools will keep changing. Your{" "}
                  <span className="font-medium">revenue model</span> and your
                  schema should outlive them.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-slate-400 mb-1">Who we serve</div>
                <p className="text-slate-200">
                  GTM teams that already use multiple tools and need a single
                  place to see how it all connects.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-slate-400 mb-1">How we work</div>
                <p className="text-slate-200">
                  Remote-first, product-obsessed and close to our customers,
                  with fast iteration and clear feedback loops.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
