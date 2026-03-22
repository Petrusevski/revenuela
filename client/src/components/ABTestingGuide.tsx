import TourGuide, { TourStep } from "./TourGuide";
import { FlaskConical, Trophy, Plus, BarChart3, Users, Check, Zap } from "lucide-react";

const STEPS: TourStep[] = [
  {
    selector: null,
    title: "GTM Stack A/B Testing",
    desc: "iqpipe lets you run two competing tool stacks in parallel — Stack A vs Stack B — against a split audience, and tells you which one drives more revenue.",
    Icon: FlaskConical,
    iconGrad: "from-fuchsia-700 to-fuchsia-500",
    tip: "Think of each experiment as a head-to-head match: your current stack vs a challenger stack. The data picks the winner.",
  },
  {
    selector: '[data-tour="ab-kpi-bar"]',
    title: "Experiment Overview",
    desc: "At a glance: how many experiments are active right now, how many are complete, total leads tested across all experiments, and your Stack A win rate.",
    Icon: BarChart3,
    iconGrad: "from-indigo-700 to-indigo-500",
    tip: "A win rate under 50% means your challenger stacks are outperforming — time to swap your defaults.",
  },
  {
    selector: '[data-tour="ab-controls"]',
    title: "Filter & Create",
    desc: "Use the tabs to filter experiments by status — All, Active, or Completed. Click 'New Experiment' to build your next A vs B test.",
    Icon: Plus,
    iconGrad: "from-sky-700 to-sky-500",
    tip: "You can run multiple experiments simultaneously with different audience splits and KPI targets.",
  },
  {
    selector: '[data-tour="ab-new-btn"]',
    title: "Creating an Experiment",
    desc: "Click here to start. You'll name your experiment, define your hypothesis, pick which KPIs matter (reply rate, meeting rate, revenue), then configure Stack A and Stack B tools and sequences.",
    Icon: FlaskConical,
    iconGrad: "from-fuchsia-700 to-fuchsia-500",
    tip: "Keep your stacks simple at first: change only one variable (e.g. outreach tool) so you know exactly what caused the difference.",
    actionLabel: "Create a new experiment →",
    actionPath: "/ab-testing",
  },
  {
    selector: '[data-tour="ab-experiment-list"]',
    title: "Your Experiments",
    desc: "Each card shows the experiment name, status, audience size, and a live comparison of Stack A vs Stack B on your chosen KPIs. Expand any card to see the full metrics breakdown.",
    Icon: Users,
    iconGrad: "from-emerald-700 to-emerald-500",
    tip: "Active experiments update as new events arrive from your connected tools — no manual data entry needed.",
  },
  {
    selector: null,
    title: "Winning with Data",
    desc: "When an experiment completes, iqpipe flags the winning stack. You can then promote that stack as your default and archive the loser — closing the loop on your GTM optimisation.",
    Icon: Trophy,
    iconGrad: "from-amber-600 to-orange-500",
    tip: "Run at least 2-3 weeks per experiment to get statistically meaningful results. Short tests give noisy data.",
  },
  {
    selector: null,
    title: "Ready to experiment!",
    desc: "Create your first A/B test now. The more experiments you run, the faster you'll find the stack combination that maximises revenue.",
    Icon: Check,
    iconGrad: "from-emerald-700 to-emerald-500",
    actionLabel: "Create first experiment →",
    actionPath: "/ab-testing",
  },
];

export default function ABTestingGuide({ onClose }: { onClose: () => void }) {
  return <TourGuide steps={STEPS} onClose={onClose} />;
}
