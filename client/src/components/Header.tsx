
const scrollToSection = (sectionId: string) => {
  if (typeof document === "undefined") return;

  const el = document.getElementById(sectionId);
  if (el) {
    // We are on a page that actually has this section – smooth scroll
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-sky-400 flex items-center justify-center text-xs font-bold">
            R
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Revenuela</div>
            <div className="text-[11px] text-slate-400">Revenue OS</div>
          </div>
        </a>

        {/* Middle nav – scroll-aware but still reusable */}
        <nav className="hidden md:flex items-center gap-6 text-xs text-slate-300">
          <a
            href="/#how-it-works"
            onClick={(e) => {
              const hasSection =
                typeof document !== "undefined" &&
                !!document.getElementById("how-it-works");
              if (hasSection) {
                e.preventDefault();
                scrollToSection("how-it-works");
              }
            }}
            className="hover:text-slate-50 cursor-pointer"
          >
            How it works
          </a>
          <a
            href="/#kpis"
            onClick={(e) => {
              const hasSection =
                typeof document !== "undefined" &&
                !!document.getElementById("kpis");
              if (hasSection) {
                e.preventDefault();
                scrollToSection("kpis");
              }
            }}
            className="hover:text-slate-50 cursor-pointer"
          >
            KPIs & dashboards
          </a>
          <a
            href="/#who"
            onClick={(e) => {
              const hasSection =
                typeof document !== "undefined" &&
                !!document.getElementById("who");
              if (hasSection) {
                e.preventDefault();
                scrollToSection("who");
              }
            }}
            className="hover:text-slate-50 cursor-pointer"
          >
            Who it’s for
          </a>
          <a
            href="/#why"
            onClick={(e) => {
              const hasSection =
                typeof document !== "undefined" &&
                !!document.getElementById("why");
              if (hasSection) {
                e.preventDefault();
                scrollToSection("why");
              }
            }}
            className="hover:text-slate-50 cursor-pointer"
          >
            Why Revenuela
          </a>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <a
            href="/login"
            className="text-xs text-slate-300 hover:text-slate-50"
          >
            Sign in
          </a>
          <a
            href="/signup"
            className="inline-flex items-center gap-1 rounded-full bg-slate-50 text-slate-950 text-xs font-medium px-3 py-1.5 hover:bg-slate-200"
          >
            Start free
          </a>
        </div>
      </div>
    </header>
  );
}
