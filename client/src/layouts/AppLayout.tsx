import { ReactNode, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AssistantPanel from "../components/AssistantPanel";
import { X } from "lucide-react"; // Import X for closing mobile sidebar

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      
      {/* Desktop Sidebar (Hidden on mobile) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay (Visible only when mobileSidebarOpen is true) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          
          {/* Sidebar Content */}
          <div className="relative w-64 bg-slate-950 border-r border-slate-800 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            {/* Reuse your existing Sidebar component here */}
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col relative w-full">
        <Topbar 
          onAskAssistant={() => setAssistantOpen(true)} 
          onMenuClick={() => setMobileSidebarOpen(true)} // Pass toggle function
        />
        <main className="flex-1 px-4 md:px-6 pb-8 pt-4 bg-slate-950/90 overflow-x-hidden">
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