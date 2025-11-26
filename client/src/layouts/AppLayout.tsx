import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion"; // For smooth animations
import { X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AssistantPanel from "../components/AssistantPanel";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Automatically close sidebar when route changes (improves mobile UX)
  const location = useLocation();
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* 1. Desktop Sidebar - Controlled by CSS only */}
      {/* We wrap it here to handle the hiding. Ensure Sidebar.tsx itself is NOT 'hidden' */}
      <div className="hidden md:block h-screen sticky top-0 overflow-y-auto border-r border-slate-800 bg-slate-950 shadow-xl z-30">
        <Sidebar />
      </div>

      {/* 2. Mobile Sidebar - Controlled by Framer Motion */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden"
            />
            
            {/* Sliding Drawer */}
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-800 z-50 md:hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                 <span className="font-semibold text-slate-100 tracking-tight">Menu</span>
                 <button 
                   onClick={() => setMobileSidebarOpen(false)}
                   className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                 >
                   <X size={20} />
                 </button>
              </div>
              
              {/* Sidebar Content Container */}
              <div className="flex-1 overflow-y-auto">
                 {/* The Sidebar component must have h-full or similar to fill this space */}
                 <Sidebar />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar 
          onAskAssistant={() => setAssistantOpen(true)} 
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 px-4 md:px-8 py-6 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <AssistantPanel
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
    </div>
  );
}