import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import { API_BASE_URL } from "../../config";
import { User, Mail, Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit name/email state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("iqpipe_token")}`,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/profile`, { headers: getHeaders() });
        if (!res.ok) throw new Error("Failed to load profile");
        const data: UserProfile = await res.json();
        setProfile(data);
        setFullName(data.fullName);
        setEmail(data.email);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ fullName, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setProfile(data);
      // Update localStorage user
      const stored = localStorage.getItem("iqpipe_user");
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem("iqpipe_user", JSON.stringify({ ...u, fullName: data.fullName, email: data.email }));
      }
      setProfileMsg({ type: "ok", text: "Profile updated successfully." });
    } catch (e: any) {
      setProfileMsg({ type: "err", text: e.message });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "err", text: "New passwords don't match." });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: "err", text: "New password must be at least 8 characters." });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/password`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwMsg({ type: "ok", text: "Password changed successfully." });
    } catch (e: any) {
      setPwMsg({ type: "err", text: e.message });
    } finally {
      setPwSaving(false);
    }
  };

  const initials = (profile?.fullName ?? fullName)
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null;

  if (loading) {
    return (
      <div>
        <PageHeader title="Profile" subtitle="Your personal account settings." />
        <div className="mt-8 flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading profile…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Profile" subtitle="Your personal account settings." />
        <div className="mt-4 rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your personal information and account security." />

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left col */}
        <div className="space-y-6 xl:col-span-2">

          {/* Identity card */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                {initials}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{profile?.fullName}</div>
                <div className="text-xs text-slate-400">{profile?.email}</div>
                {joinedDate && (
                  <div className="text-[10px] text-slate-600 mt-0.5">Member since {joinedDate}</div>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <User size={14} className="text-indigo-400" />
                Personal information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 flex items-center gap-1">
                    <Mail size={10} />
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {profileMsg && (
                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                  profileMsg.type === "ok"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}>
                  {profileMsg.type === "ok" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {profileMsg.text}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 text-xs font-medium text-white disabled:cursor-not-allowed"
                >
                  {profileSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>

          {/* Password change */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Lock size={14} className="text-indigo-400" />
              Change password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your current password"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              {pwMsg && (
                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                  pwMsg.type === "ok"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}>
                  {pwMsg.type === "ok" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {pwMsg.text}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={pwSaving || !currentPassword || !newPassword}
                  className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 text-xs font-medium text-white disabled:cursor-not-allowed"
                >
                  {pwSaving ? "Changing…" : "Change password"}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right col */}
        <div className="space-y-6">
          {/* Account info */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold text-slate-100 mb-3">Account</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">User ID</span>
                <span className="text-slate-300 font-mono text-[10px]">{profile?.id.slice(0, 12)}…</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Member since</span>
                <span className="text-slate-300">{joinedDate ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Account status</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px]">Active</span>
              </div>
            </div>
          </section>

          {/* Danger zone */}
          <section className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
            <h2 className="text-sm font-semibold text-rose-300 mb-1">Danger zone</h2>
            <p className="text-xs text-slate-500 mb-3">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            <button
              onClick={() => window.alert("To delete your account please contact support@iqpipe.io")}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-rose-500/30 text-[11px] text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              Delete my account
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
