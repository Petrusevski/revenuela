import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Fingerprint,
  Zap,
  Webhook,
  PlugZap,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

// ── Data ───────────────────────────────────────────────────────────────────────

// Single source of truth — mirrors the app's IntegrationsPage exactly.
const ALL_INTEGRATIONS = [
  // Prospecting & Sourcing
  { name: "Clay",             domain: "clay.com",           category: "Prospecting"  },
  { name: "Apollo",           domain: "apollo.io",          category: "Prospecting"  },
  { name: "PhantomBuster",    domain: "phantombuster.com",  category: "Prospecting"  },
  // Enrichment & Data
  { name: "Clearbit",         domain: "clearbit.com",       category: "Enrichment"   },
  { name: "ZoomInfo",         domain: "zoominfo.com",       category: "Enrichment"   },
  { name: "People Data Labs", domain: "peopledatalabs.com", category: "Enrichment"   },
  { name: "Hunter.io",        domain: "hunter.io",          category: "Enrichment"   },
  { name: "Lusha",            domain: "lusha.com",          category: "Enrichment"   },
  { name: "Cognism",          domain: "cognism.com",        category: "Enrichment"   },
  { name: "Snov.io",          domain: "snov.io",            category: "Enrichment"   },
  { name: "RocketReach",      domain: "rocketreach.co",     category: "Enrichment"   },
  // LinkedIn Outreach
  { name: "HeyReach",         domain: "heyreach.io",        category: "LinkedIn"     },
  { name: "Expandi",          domain: "expandi.io",         category: "LinkedIn"     },
  { name: "Dripify",          domain: "dripify.io",         category: "LinkedIn"     },
  { name: "Waalaxy",          domain: "waalaxy.com",        category: "LinkedIn"     },
  { name: "Meet Alfred",      domain: "meetalfred.com",     category: "LinkedIn"     },
  // Cold Email Outreach
  { name: "Smartlead",        domain: "smartlead.ai",       category: "Email"        },
  { name: "Instantly",        domain: "instantly.ai",       category: "Email"        },
  { name: "Lemlist",          domain: "lemlist.com",        category: "Email"        },
  { name: "Mailshake",        domain: "mailshake.com",      category: "Email"        },
  // Multichannel Outreach
  { name: "Outreach",         domain: "outreach.io",        category: "Multichannel" },
  { name: "Salesloft",        domain: "salesloft.com",      category: "Multichannel" },
  { name: "Reply.io",         domain: "reply.io",           category: "Multichannel" },
  { name: "Klenty",           domain: "klenty.com",         category: "Multichannel" },
  // Phone & Calling
  { name: "Aircall",          domain: "aircall.io",         category: "Calling"      },
  { name: "Dialpad",          domain: "dialpad.com",        category: "Calling"      },
  { name: "Kixie",            domain: "kixie.com",          category: "Calling"      },
  { name: "Orum",             domain: "orum.io",            category: "Calling"      },
  // SMS & WhatsApp
  { name: "Twilio",           domain: "twilio.com",         category: "SMS"          },
  { name: "Sakari",           domain: "sakari.io",          category: "SMS"          },
  { name: "WATI",             domain: "wati.io",            category: "SMS"          },
  // CRM
  { name: "HubSpot",          domain: "hubspot.com",        category: "CRM"          },
  { name: "Pipedrive",        domain: "pipedrive.com",      category: "CRM"          },
  { name: "Salesforce",       domain: "salesforce.com",     category: "CRM"          },
  // Revenue & Billing
  { name: "Stripe",           domain: "stripe.com",         category: "Billing"      },
  { name: "Chargebee",        domain: "chargebee.com",      category: "Billing"      },
  // Automation
  { name: "n8n",              domain: "n8n.io",             category: "Automation"   },
  { name: "Make",             domain: "make.com",           category: "Automation"   },
];


const CATEGORY_STYLES: Record<string, { badge: string; dot: string }> = {
  Prospecting:  { badge: "bg-violet-500/10 border-violet-500/20 text-violet-300",  dot: "bg-violet-400"  },
  Enrichment:   { badge: "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-300", dot: "bg-fuchsia-400" },
  LinkedIn:     { badge: "bg-blue-500/10 border-blue-500/20 text-blue-300",        dot: "bg-blue-400"    },
  Email:        { badge: "bg-sky-500/10 border-sky-500/20 text-sky-300",           dot: "bg-sky-400"     },
  Multichannel: { badge: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",  dot: "bg-indigo-400"  },
  Calling:      { badge: "bg-orange-500/10 border-orange-500/20 text-orange-300",  dot: "bg-orange-400"  },
  SMS:          { badge: "bg-amber-500/10 border-amber-500/20 text-amber-300",     dot: "bg-amber-400"   },
  CRM:          { badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300", dot: "bg-emerald-400" },
  Billing:      { badge: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",  dot: "bg-yellow-400"  },
  Automation:   { badge: "bg-slate-500/10 border-slate-500/20 text-slate-300",     dot: "bg-slate-400"   },
};

// ── Tool card ─────────────────────────────────────────────────────────────────

function ToolCard({ name, domain, category }: { name: string; domain: string; category: string }) {
  const [err, setErr] = useState(false);
  const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Automation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className="flex items-center gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70 transition-all"
    >
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
        {!err ? (
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
            alt={name}
            width={22}
            height={22}
            className="object-contain"
            onError={() => setErr(true)}
          />
        ) : (
          <div className="w-full h-full bg-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-300 rounded-xl">
            {name[0]}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-200 truncate">{name}</div>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${style.badge}`}>
        {category}
      </span>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PublicIntegrationsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Header />

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative border-b border-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-500/8 blur-[80px] pointer-events-none" />
          <div className="relative mx-auto max-w-4xl px-4 pt-20 pb-16 text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-medium text-indigo-300 mb-6">
                <Zap size={11} className="fill-current" /> 38 integrations
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Every tool in your GTM stack.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-emerald-400">
                  One event layer to connect them all.
                </span>
              </h1>
              <p className="text-slate-400 text-base max-w-xl mx-auto mb-8 leading-relaxed">
                iqpipe captures events from every tool you already use. Prospecting, enrichment, outreach, CRM, billing — every signal flows into one neutral schema, linked by a single contact identity.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-white text-slate-950 px-6 py-3 rounded-full font-bold text-sm hover:bg-slate-100 transition-all shadow-lg"
                >
                  Connect your stack <ArrowRight size={15} />
                </a>
                <a
                  href="/demo"
                  className="inline-flex items-center gap-2 border border-slate-700 text-slate-300 px-6 py-3 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all"
                >
                  See it in action
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── How connection works ── */}
        <section className="border-b border-slate-900 py-12 px-4 bg-slate-950/60">
          <div className="mx-auto max-w-4xl">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: Webhook,
                  color: "indigo",
                  title: "Webhook ingest",
                  body: "Paste your iqpipe workspace URL into any tool's webhook settings. Events start flowing in seconds — no code, no engineers.",
                },
                {
                  icon: PlugZap,
                  color: "fuchsia",
                  title: "Native integrations",
                  body: "For supported tools, connect directly from the iqpipe Integrations page using OAuth or API key. One click, fully managed.",
                },
                {
                  icon: Fingerprint,
                  color: "emerald",
                  title: "Universal ID linking",
                  body: "Every event from every tool is normalized into one schema and linked by a Universal ID — one contact identity across your entire stack.",
                },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/40"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-${item.color}-500/10 border border-${item.color}-500/20`}>
                      <ItemIcon size={16} className={`text-${item.color}-400`} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-1">{item.title}</div>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.body}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Integration grid ── */}
        <section className="py-16 px-4">
          <div className="mx-auto max-w-6xl">

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {ALL_INTEGRATIONS.map((t, i) => (
                  <motion.div
                    key={t.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <ToolCard {...t} />
                  </motion.div>
                ))}
            </div>
          </div>
        </section>

        {/* ── Request an integration ── */}
        <section className="border-t border-slate-900 py-16 px-4 bg-slate-950/60">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 mb-5">
              <PlugZap size={20} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Don't see your tool?</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              If your tool supports outbound webhooks, iqpipe can already receive its events. Send us the tool name and we'll add native support — usually within one release cycle.
            </p>
            <a
              href="mailto:hello@iqpipe.io?subject=Integration request"
              className="inline-flex items-center gap-2 border border-slate-700 text-slate-300 px-6 py-3 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all"
            >
              Request an integration <ArrowRight size={14} />
            </a>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-4 text-center border-t border-slate-900">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto"
          >
            <div className="flex justify-center mb-5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Fingerprint size={24} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Your stack. One event layer.</h2>
            <p className="text-slate-400 text-sm mb-8">
              Connect your first tool in under 5 minutes. No card required for 30 days.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
            >
              Start free trial <ArrowRight size={16} />
            </a>
          </motion.div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
