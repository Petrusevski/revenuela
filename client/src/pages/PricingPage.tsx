import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const PRICING_TIERS = [
  {
    id: "growth",
    name: "Growth",
    description: "Perfect for teams starting to unify their GTM data stack.",
    monthlyPrice: 29,
    yearlyPrice: 24, // ~20% off
    features: [
      "3 Seats included",
      "2 Active Workspaces",
      "Standard Tool Comparison",
      "Basic Journey Timeline",
      "Email Support",
    ],
    cta: "Start 30-Day Free Trial",
    popular: false,
    gradient: "from-slate-800 to-slate-900",
    border: "border-slate-800",
  },
  {
    id: "scale",
    name: "Scale",
    description: "Full revenue attribution & intelligence for high-volume engines.",
    monthlyPrice: 299,
    yearlyPrice: 249, // ~20% off
    features: [
      "Unlimited Seats & Workspaces",
      "Advanced Attribution Models",
      "Workflow ROI Intelligence",
      "Full Journey History (Unlimited)",
      "API Access & Webhooks",
      "Priority 24/7 Support",
    ],
    cta: "Start 30-Day Free Trial",
    popular: true,
    highlight: "Most Popular",
    gradient: "from-indigo-900/60 to-slate-900",
    border: "border-indigo-500/50",
  },
];

const FAQS = [
  {
    q: "What happens after the 30-day trial?",
    a: "You can choose to subscribe to keep your data pipeline active. If not, we'll pause ingestion, but your data remains accessible for export for another 30 days.",
  },
  {
    q: "What counts as a 'Workspace'?",
    a: "A workspace is usually one GTM environment (e.g., 'US Sales' vs 'EU Sales'). Most companies only need one, but agencies might need multiple.",
  },
  {
    q: "Can I connect custom tools?",
    a: "Yes. Our Universal Webhook Receiver allows you to ingest JSON payloads from any tool, even if we don't have a native integration yet.",
  },
  {
    q: "Is historical data included?",
    a: "On the Scale plan, yes. We can backfill data if your connected tools support historical API exports.",
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans selection:bg-indigo-500/30">
      <Header />

      <main className="flex-1">
        {/* Header Section */}
        <section className="pt-20 pb-12 md:pt-32 md:pb-20 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            Simple pricing, <br />
            <span className="text-indigo-400">massive ROI.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto mb-10"
          >
            Start with a 30-day free trial on any plan. No credit card required to start.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4 mb-16"
          >
            <span
              className={`text-sm font-medium ${
                !isYearly ? "text-slate-50" : "text-slate-400"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="w-14 h-7 bg-slate-800 rounded-full relative p-1 transition-colors hover:bg-slate-700"
            >
              <motion.div
                animate={{ x: isYearly ? 28 : 0 }}
                className="w-5 h-5 bg-indigo-500 rounded-full shadow-lg"
              />
            </button>
            <span
              className={`text-sm font-medium flex items-center gap-2 ${
                isYearly ? "text-slate-50" : "text-slate-400"
              }`}
            >
              Yearly{" "}
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                -20%
              </span>
            </span>
          </motion.div>

          {/* Pricing Cards (Centered Grid) */}
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 px-2">
            {PRICING_TIERS.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className={`relative flex flex-col rounded-3xl border ${tier.border} bg-gradient-to-b ${tier.gradient} p-8 shadow-2xl backdrop-blur-sm`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg shadow-indigo-500/40 tracking-wide uppercase">
                    {tier.highlight}
                  </div>
                )}

                <div className="mb-6 text-left">
                  <h3 className="text-xl font-bold mb-2 text-white">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-slate-400 h-10">
                    {tier.description}
                  </p>
                </div>

                <div className="mb-8 text-left">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-slate-50">
                      ${isYearly ? tier.yearlyPrice : tier.monthlyPrice}
                    </span>
                    <span className="text-slate-400 mb-1">/mo</span>
                  </div>
                  {isYearly && (
                    <div className="text-xs text-slate-400 mt-1">
                      Billed ${tier.yearlyPrice * 12} yearly
                    </div>
                  )}
                </div>

                <button
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                    tier.popular
                      ? "bg-white text-slate-950 hover:bg-slate-200 shadow-lg"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  }`}
                >
                  {tier.cta}
                </button>

                <div className="mt-8 space-y-4 text-left flex-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    What's included
                  </p>
                  {tier.features.map((feat) => (
                    <div
                      key={feat}
                      className="flex items-start gap-3 text-sm text-slate-300"
                    >
                      <CheckCircle2
                        size={16}
                        className={
                          tier.popular
                            ? "text-emerald-400 shrink-0 mt-0.5"
                            : "text-indigo-500 shrink-0 mt-0.5"
                        }
                      />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Enterprise / Trust Section */}
        <section className="py-20 bg-slate-950 border-y border-slate-900">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-12">
              Trusted by modern revenue teams
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale">
              {/* Placeholder Logos */}
              {["Acme Corp", "Global Bank", "SaaS Inc", "Future Tech"].map(
                (name) => (
                  <div
                    key={name}
                    className="text-xl font-bold text-slate-600 flex items-center justify-center h-12 border border-dashed border-slate-800 rounded-lg"
                  >
                    {name}
                  </div>
                )
              )}
            </div>

            <div className="mt-16 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-8 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Shield size={18} className="text-indigo-400" /> Enterprise
                  Security
                </h3>
                <p className="text-slate-400 text-sm mt-1 max-w-md">
                  SOC2 Type II ready. GDPR & CCPA compliant. We keep your data
                  safe with encryption at rest and in transit.
                </p>
              </div>
              <a
                href="/contact"
                className="shrink-0 px-5 py-2.5 rounded-lg bg-slate-100 text-slate-950 font-medium text-sm hover:bg-white transition-colors"
              >
                Review Security Docs
              </a>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800"
              >
                <h3 className="text-lg font-semibold text-slate-200 mb-2">
                  {faq.q}
                </h3>
                <p className="text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 text-center">
          <h2 className="text-2xl font-bold mb-6">
            Stop guessing where revenue comes from.
          </h2>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
          >
            Start your free trial <ArrowRight size={20} />
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}