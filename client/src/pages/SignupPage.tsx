import { FormEvent, useState } from "react";
import { ArrowLeft, Lock, Mail, User } from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

interface SignupPageProps {
  onSignupSuccess?: (payload: { token: string; user: { id: string; email: string; fullName: string } }) => void;
}

export default function SignupPage({ onSignupSuccess }: SignupPageProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Signup failed.");
        return;
      }

      localStorage.setItem("revenuela_token", data.token);
      localStorage.setItem("revenuela_user", JSON.stringify(data.user));

      if (onSignupSuccess) {
        onSignupSuccess(data);
      } else {
        window.location.href = "/"; // go to dashboard
      }
    } catch (err: any) {
      setError(err?.message || "Unexpected error during signup.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-50 selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Left: Visual Side */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden border-r border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative z-10 max-w-md px-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.2 }}
            className="relative p-8 rounded-3xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl"
          >
            {/* Mock UI Card */}
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
               <div className="h-3 w-3 rounded-full bg-rose-500/50" />
               <div className="h-3 w-3 rounded-full bg-amber-500/50" />
               <div className="h-3 w-3 rounded-full bg-emerald-500/50" />
            </div>
            
            <div className="space-y-4">
               <div className="h-2 w-2/3 rounded bg-slate-800" />
               <div className="h-2 w-full rounded bg-slate-800" />
               <div className="h-2 w-5/6 rounded bg-slate-800" />
               <div className="flex gap-2 mt-4">
                  <div className="h-8 w-20 rounded-lg bg-indigo-500/20 border border-indigo-500/30" />
                  <div className="h-8 w-20 rounded-lg bg-slate-800" />
               </div>
            </div>

            <div className="absolute -right-6 -bottom-6 h-24 w-24 bg-indigo-500/30 blur-3xl rounded-full" />
          </motion.div>

          <div className="mt-10">
             <h3 className="text-xl font-bold text-white">Join the GTM elite.</h3>
             <p className="text-slate-400 text-sm mt-2">Get started in minutes. Connect your stack and see your first revenue journey today.</p>
          </div>
        </div>
      </div>

      {/* Right: Form Side */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
        
        <a href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </a>

        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 text-white text-xl font-bold shadow-lg shadow-fuchsia-500/20 mb-4">
              R
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Create your account</h2>
            <p className="text-sm text-slate-400 mt-2">
              Start your 30-day free trial. No credit card required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="password"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : "Get started"}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <a href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}