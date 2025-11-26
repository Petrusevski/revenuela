import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Workflow, 
  BarChart3, 
  Activity, 
  Plug, 
  Settings, 
  Route
} from "lucide-react";

const navGroups = [
  {
    title: "Analyze",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Performance", path: "/performance", icon: BarChart3 },
      { label: "Journeys", path: "/journeys", icon: Route },
    ]
  },
  {
    title: "Execute",
    items: [
      { label: "Leads", path: "/leads", icon: Users },
      { label: "Workflows", path: "/workflows", icon: Workflow },
      { label: "Activity", path: "/activity", icon: Activity },
    ]
  },
  {
    title: "Configure",
    items: [
      { label: "Integrations", path: "/integrations", icon: Plug },
      { label: "Settings", path: "/settings", icon: Settings },
    ]
  }
];

export default function Sidebar() {
  return (
    // UPDATED CLASSES:
    // 1. Removed 'hidden' (so it shows on mobile)
    // 2. Removed 'sticky', 'top-0', 'h-screen' (AppLayout handles positioning now)
    // 3. Added 'h-full' to ensure it fills the mobile drawer
    <aside className="w-full md:w-64 h-full flex flex-col bg-slate-950">
      
      {/* BRAND HEADER */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/50 bg-slate-900/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
             {/* Abstract Logo Icon */}
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
               <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
             </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white leading-none">Revenuela</span>
            <span className="text-[10px] font-medium text-indigo-400 tracking-wide mt-0.5">REVENUE OS</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto no-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? "bg-indigo-500/10 text-indigo-300 shadow-sm shadow-indigo-900/10 border border-indigo-500/20" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent hover:border-slate-800"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon 
                        size={18} 
                        className={`transition-colors ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} 
                      />
                      <span>{item.label}</span>
                      {/* Active Indicator Dot */}
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* FOOTER / WORKSPACE CARD */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/30 shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer group">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 group-hover:text-white group-hover:border-slate-600">
            DS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white">Demo SaaS</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </p>
          </div>
          <Settings size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>
      </div>
    </aside>
  );
}