import TourGuide, { TourStep } from "./TourGuide";
import { Plug, Users, LayoutDashboard, Zap, BarChart3, Sparkles, Check } from "lucide-react";

export const SETUP_KEY = "iqpipe_setup_complete";

const STEPS: TourStep[] = [
  {
    selector: null,
    title: "Welcome to iqpipe",
    desc: "This is a quick guided tour of your GTM intelligence platform. We'll highlight each key section so you know exactly where everything lives.",
    Icon: Sparkles,
    iconGrad: "from-indigo-600 to-fuchsia-600",
  },
  {
    selector: 'a[href="/integrations"]',
    title: "Integrations — Start Here",
    desc: "Connect your GTM stack first. HeyReach, Lemlist, Instantly, SmartLead, HubSpot, Apollo, Clearbit, and more. Paste your API key to activate each tool.",
    Icon: Plug,
    iconGrad: "from-sky-700 to-sky-500",
    tip: "Connect at least one outreach tool to start seeing real-time events and signals flow into your dashboard.",
    actionLabel: "Connect your tools →",
    actionPath: "/integrations",
  },
  {
    selector: 'a[href="/leads"]',
    title: "Contacts",
    desc: "Your unified contact database. Import leads via CSV or Google Sheets, then score and track them across every tool in your stack.",
    Icon: Users,
    iconGrad: "from-emerald-700 to-emerald-500",
    tip: "CSV needs these headers: Email*, First Name, Last Name, Company, Title. For Google Sheets, share with the sync-bot service account first.",
    actionLabel: "Import your contacts →",
    actionPath: "/leads",
  },
  {
    selector: 'a[href="/dashboard"]',
    title: "Signal Center",
    desc: "Your GTM command center. Live KPIs, tool health scores, recent events, and revenue signals from every connected tool — all in one real-time view.",
    Icon: LayoutDashboard,
    iconGrad: "from-indigo-700 to-indigo-500",
    tip: "Start here every morning to see what happened overnight across your entire outreach stack.",
    actionLabel: "Open Signal Center →",
    actionPath: "/dashboard",
  },
  {
    selector: 'a[href="/events"]',
    title: "Events Feed",
    desc: "A real-time stream of signals across all your tools. Email opens, replies, campaign starts, enrichments — everything in one chronological activity feed.",
    Icon: Zap,
    iconGrad: "from-amber-600 to-orange-500",
    tip: "Webhook tools (HeyReach, Lemlist, Instantly, SmartLead) push events here automatically once connected.",
    actionLabel: "View Events →",
    actionPath: "/events",
  },
  {
    selector: 'a[href="/performance"]',
    title: "Tool Performance",
    desc: "Compare how every connected tool is performing — open rates, reply rates, lead volume, and cost-per-lead side by side so you can cut what's not working.",
    Icon: BarChart3,
    iconGrad: "from-violet-700 to-violet-500",
    tip: "Use this to make data-driven decisions about your tool spend — usually reveals 1-2 tools you can cut immediately.",
    actionLabel: "View Performance →",
    actionPath: "/performance",
  },
  {
    selector: '[data-tour="setup-guide-btn"]',
    title: "Setup Guide",
    desc: "This button lives in your sidebar and re-opens this tour anytime. Come back whenever you need a refresher on any section.",
    Icon: Sparkles,
    iconGrad: "from-slate-700 to-slate-600",
  },
  {
    selector: null,
    title: "You're ready to go!",
    desc: "Connect your first integration to start seeing real-time GTM signals. Your Signal Center will come alive as data starts flowing in.",
    Icon: Check,
    iconGrad: "from-emerald-700 to-emerald-500",
    actionLabel: "Go to Integrations →",
    actionPath: "/integrations",
  },
];

export default function SetupWizard({ onClose }: { onClose: () => void }) {
  return <TourGuide steps={STEPS} onClose={onClose} storageKey={SETUP_KEY} />;
}
