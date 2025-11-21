import { Link } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 ring-1 ring-indigo-500/40">
            <Fingerprint size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Revenuela</div>
            <div className="text-[11px] text-slate-400">Revenue OS</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/how-it-works" 
            className="text-xs font-medium text-slate-300 hover:text-slate-50 transition-colors"
          >
            How it works
          </Link>
          <Link 
            to="/gtm-stack" 
            className="text-xs font-medium text-slate-300 hover:text-slate-50 transition-colors"
          >
            GTM Stack
          </Link>
          <Link 
            to="/pricing" 
            className="text-xs font-medium text-slate-300 hover:text-slate-50 transition-colors"
          >
            Pricing
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/login"
            className="text-xs text-slate-300 hover:text-slate-50"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1 rounded-full bg-slate-50 text-slate-950 text-xs font-medium px-3 py-1.5 hover:bg-slate-200"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}