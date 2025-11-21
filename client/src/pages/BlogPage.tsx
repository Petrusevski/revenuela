import Header from "../components/Header";
import Footer from "../components/Footer";

const posts = [
  {
    title: "Why your GTM stack needs a neutral revenue schema",
    date: "October 2025",
    tag: "Foundations",
    excerpt:
      "CRMs, outbound tools and billing systems all see different slices of reality. A neutral schema is how you stop arguing about the numbers."
  },
  {
    title: "From spreadsheets to Revenue OS: a RevOps migration story",
    date: "September 2025",
    tag: "RevOps",
    excerpt:
      "How one team moved from weekly CSV exports to a live stitched funnel, without replacing any of their existing tools."
  },
  {
    title: "Comparing outbound engines: Clay + HeyReach vs Apollo alone",
    date: "August 2025",
    tag: "GTM motions",
    excerpt:
      "What happens when you look at reply, meeting and win rates on a motion level instead of inside each tool?"
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="border-b border-slate-900 bg-slate-950">
          <div className="mx-auto max-w-4xl px-4 pt-10 pb-12 md:pt-14 md:pb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 mb-4 text-sm text-slate-200">
              Revenuela Blog
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-3">
              Thoughts on GTM data, revenue engines{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400">
                and the tools in between
              </span>
              .
            </h1>

            <p className="text-base text-slate-300 mb-8">
              Deep dives, playbooks and behind-the-scenes notes as we build a
              Revenue OS that connects the tools you already use.
            </p>

            <div className="space-y-4">
              {posts.map((post) => (
                <article
                  key={post.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2 text-sm text-slate-400">
                    <span>{post.date}</span>
                    <span className="rounded-full border border-slate-600 px-2 py-0.5 text-xs">
                      {post.tag}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-50 mb-1">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-300 mb-3">{post.excerpt}</p>
                  <button className="text-sm text-cyan-300 hover:text-cyan-200 underline underline-offset-4">
                    Read more (coming soon)
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
