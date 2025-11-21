import { ReactNode, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AssistantPanel from "../components/AssistantPanel";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col relative">
        <Topbar onAskAssistant={() => setAssistantOpen(true)} />
        <main className="flex-1 px-6 pb-8 pt-4 bg-slate-950/90">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        <AssistantPanel
          isOpen={assistantOpen}
          onClose={() => setAssistantOpen(false)}
        />
      </div>
    </div>
  );
}
