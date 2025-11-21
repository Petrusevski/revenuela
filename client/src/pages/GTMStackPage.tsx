import { useState } from "react"; // Fixed: Removed 'React' default import
import { motion } from "framer-motion";
import {
  Search,
  Database,
  Zap,
  CreditCard,
  Layers,
  ArrowRight,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import IntegrationRequestModal from "../components/IntegrationRequestModal";

// --- Data for the Stack ---

const SECTIONS = [
  {
    id: "prospecting",
    title: "Prospecting & Sourcing",
    description: "Discover and source ICP-fit leads at the top of your funnel.",
    icon: Search,
    color: "text-blue-400",
    gradient: "from-blue-500/20 to-indigo-500/5",
    apps: [
      { name: "Clay", desc: "Waterfall enrichment & lead lists." },
      { name: "Apollo", desc: "B2B database with 275M+ contacts." },
      { name: "ZoomInfo", desc: "Enterprise-grade company intelligence." },
      { name: "Clearbit", desc: "Real-time prospect discovery." },
      { name: "Lusha", desc: "Direct dials and contact data." },
      { name: "Hunter", desc: "Domain search & email verification." },
      { name: "PhantomBuster", desc: "Code-free automation & scraping." },
      { name: "BuiltWith", desc: "Technographic data sourcing." },
    ],
  },
  {
    id: "enrichment",
    title: "Data Enrichment",
    description: "Hydrate records with firmographics, emails, and social data.",
    icon: Layers,
    color: "text-fuchsia-400",
    gradient: "from-fuchsia-500/20 to-pink-500/5",
    apps: [
      { name: "Clearbit", desc: "Live enrichment APIs." },
      { name: "Dropcontact", desc: "GDPR-compliant email finding." },
      { name: "FullContact", desc: "Identity resolution engine." },
      { name: "People Data Labs", desc: "Developer-focused person data." },
      { name: "LeadIQ", desc: "One-click capture for sales teams." },
      { name: "Datagma", desc: "Reliable B2B contact enrichment." },
    ],
  },
  {
    id: "crm",
    title: "CRM & Database",
    description: "Sync every activity back to your source of truth.",
    icon: Database,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-teal-500/5",
    apps: [
      { name: "HubSpot", desc: "Two-way sync for contacts & deals." },
      { name: "Salesforce", desc: "Enterprise CRM integration." },
      { name: "Pipedrive", desc: "Deal-driven sales management." },
      { name: "Close", desc: "High-velocity sales CRM." },
      { name: "Attio", desc: "Data-driven flexible CRM." },
      { name: "Airtable", desc: "Custom bases as a CRM." },
    ],
  },
  {
    id: "outbound",
    title: "Outbound Orchestration",
    description: "Execute multi-channel campaigns at scale.",
    icon: Zap,
    color: "text-orange-400",
    gradient: "from-orange-500/20 to-amber-500/5",
    apps: [
      { name: "SmartLead", desc: "Unlimited mailbox warming & sending." },
      { name: "Instantly", desc: "Cold email with AI optimization." },
      { name: "Lemlist", desc: "Personalized multi-channel outreach." },
      { name: "HeyReach", desc: "Scalable LinkedIn automation." },
      { name: "Outreach", desc: "Enterprise sales engagement." },
      { name: "Reply.io", desc: "AI-powered sales acceleration." },
    ],
  },
  {
    id: "billing",
    title: "Revenue & Billing",
    description: "Close the loop by attributing revenue to the source.",
    icon: CreditCard,
    color: "text-violet-400",
    gradient: "from-violet-500/20 to-purple-500/5",
    apps: [
      { name: "Stripe", desc: "Payments infrastructure for the internet." },
      { name: "Paddle", desc: "SaaS billing & merchant of record." },
      { name: "Chargebee", desc: "Subscription management at scale." },
      { name: "LemonSqueezy", desc: "Tax-compliant SaaS payments." },
    ],
  },
];

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVars = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function GTMStackPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans selection:bg-indigo-500/30">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-20 md:py-32 overflow-hidden border-b border-slate-900 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950 z-0" />

          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                The Modern <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-sky-400">
                  Revenue Stack
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Revenuela connects natively with 40+ best-in-class tools. No
                Zapier glue, no broken spreadsheets. Just one unified schema.
              </p>

              <div className="flex items-center justify-center gap-4">
                <a
                  href="/signup"
                  className="bg-slate-50 text-slate-950 px-6 py-3 rounded-full font-semibold hover:bg-slate-200 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Connect your stack
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stack Sections */}
        <div className="relative z-10 -mt-12 px-4 pb-24 space-y-6">
          {SECTIONS.map((section) => (
            <motion.section
              key={section.id}
              variants={containerVars}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="mx-auto max-w-6xl rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-6 md:p-10 shadow-2xl"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-12 mb-8">
                {/* Section Header */}
                <div className="md:w-64 shrink-0">
                  <div
                    className={`inline-flex p-3 rounded-xl bg-slate-900 border border-slate-800 mb-4 ${section.color}`}
                  >
                    <section.icon size={24} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{section.title}</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {section.description}
                  </p>
                </div>

                {/* Apps Grid */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {section.apps.map((app) => (
                    <motion.div
                      key={app.name}
                      variants={itemVars}
                      className="group relative rounded-xl border border-slate-800 bg-slate-950/50 p-4 hover:border-slate-600 hover:bg-slate-900 transition-all duration-200"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-500`}
                      />

                      <div className="relative z-10">
                        {/* Placeholder Logo Box */}
                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 mb-3 shadow-inner group-hover:scale-105 transition-transform">
                          {app.name[0]}
                        </div>
                        <div className="font-semibold text-sm text-slate-200 mb-1">
                          {app.name}
                        </div>
                        <div className="text-[11px] text-slate-500 group-hover:text-slate-400 leading-snug">
                          {app.desc}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* "More" Card triggers modal */}
                  <motion.button
                    onClick={() => setIsModalOpen(true)}
                    variants={itemVars}
                    className="flex items-center justify-center rounded-xl border border-dashed border-slate-800 p-4 text-slate-500 text-xs hover:text-slate-300 hover:border-slate-600 hover:bg-slate-900/50 transition-colors cursor-pointer w-full"
                  >
                    + Request Integration
                  </motion.button>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        {/* CTA */}
        <section className="py-20 border-t border-slate-900 bg-slate-950 text-center">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-3xl font-bold mb-6">Don't see your tool?</h2>
            <p className="text-slate-400 mb-8">
              Our universal webhook receiver can ingest data from any tool that
              speaks JSON. Connect custom sources in minutes.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              View API Documentation <ArrowRight size={16} />
            </a>
          </div>
        </section>
      </main>

      <Footer />

      {/* Modal Component */}
      <IntegrationRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}