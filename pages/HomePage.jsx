import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  ChevronRight,
  Clock3,
  Flame,
  Menu,
  Search,
  Sparkles,
  TrendingUp,
  FileText,
  PenLine,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../src/services/api";

const categories = [
  "All stories",
  "Technology",
  "Design",
  "Lifestyle",
  "Business",
  "Productivity",
];

function Author({ initials, name }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
        {initials}
      </div>
      <span className="truncate text-xs font-semibold text-slate-700">
        {name}
      </span>
    </div>
  );
}

function ArticleCard({ article, saved, onSave }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50">
      <Link
        to={`/posts/${article.id}`}
        className="relative block aspect-[16/10] overflow-hidden bg-slate-100"
        aria-label={`Read ${article.title}`}
      >
        <img
          src={article.image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-bold ${article.color}`}
        >
          {article.category}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
          <span>{article.date}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock3 size={12} />
            {article.readTime}
          </span>
        </div>

        <Link to={`/posts/${article.id}`}>
          <h3 className="text-lg font-bold leading-snug tracking-tight text-slate-900 transition group-hover:text-indigo-600 sm:text-xl">
            {article.title}
          </h3>
        </Link>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
          {article.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <Author initials={article.initials} name={article.author} />
          <button
            type="button"
            onClick={() => onSave(article.id)}
            aria-label={saved ? "Remove bookmark" : "Bookmark article"}
            aria-pressed={saved}
            className={`rounded-lg p-2 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              saved
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All stories");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedArticles, setSavedArticles] = useState([]);
  const [articles, setArticles] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/posts", { params: { page: 1, limit: 30 } })
      .then((response) => {
        const payload = response.data?.data ?? response.data;
        const list = Array.isArray(payload) ? payload : payload?.posts ?? [];
        const mapped = list.map((post, index) => {
          const author = typeof post.author === "object" ? post.author : null;
          const title = post.title || "Untitled story";
          const content = String(post.content || "");
          const words = content.trim().split(/\s+/).filter(Boolean).length;
          return {
            id: post.slug || post._id || post.id,
            category: typeof post.category === "object" ? post.category?.name || "Stories" : post.category || "Stories",
            title,
            excerpt: post.excerpt || (content.length > 180 ? `${content.slice(0, 177)}...` : content),
            author: author?.name || post.authorName || "Inkline Author",
            initials: (author?.name || "IA").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
            date: post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "Recently published",
            readTime: `${Math.max(1, Math.ceil(words / 200))} min read`,
            image: post.coverImage || post.featuredImage || post.image || "https://images.unsplash.com/photo-1455390582262-044c1d7b7c20?auto=format&fit=crop&w=1000&q=80",
            featured: index === 0,
            color: ["bg-violet-100 text-violet-700", "bg-pink-100 text-pink-700", "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700"][index % 4],
          };
        });
        if (active) setArticles(mapped);
      })
      .catch((err) => {
        if (active) setStoriesError(err.response?.data?.message || "Unable to load stories from the server.");
      })
      .finally(() => { if (active) setStoriesLoading(false); });
    return () => { active = false; };
  }, []);

  const trending = articles.slice(0, 3).map((article, index) => ({
    number: String(index + 1).padStart(2, "0"), title: article.title, time: article.readTime, id: article.id,
  }));


const filteredArticles = useMemo(() => {
  const query = searchQuery.trim().toLowerCase();

  return articles.filter((article) => {
    const matchesCategory =
      activeCategory === "All stories" ||
      article.category.toLowerCase() === activeCategory.toLowerCase();

    const matchesSearch =
      !query ||
      `${article.title} ${article.excerpt} ${article.author} ${article.category}`
        .toLowerCase()
        .includes(query);

    return matchesCategory && matchesSearch;
  });
}, [articles, activeCategory, searchQuery]);


  const toggleSave = (id) => {
    setSavedArticles((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  const featuredArticle = articles.find((article) => article.featured);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <BookOpen size={21} />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Inkline<span className="text-indigo-600">.</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#stories"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              Discover
            </a>
            <a
              href="#trending"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              Trending
            </a>
            <a
              href="#newsletter"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              Newsletter
            </a>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <label className="relative hidden lg:block">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  document.getElementById("stories")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                placeholder="Search stories..."
                aria-label="Search stories"
                className="h-10 w-48 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </label>

            {!loading &&
              (isAuthenticated ? (
                <>
                  <Link
                    to="/write"
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Write a story
                  </Link>
                  {user?.role === "admin" && <Link to="/admin" className="rounded-xl px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50">Admin</Link>}
                  <Link
                    to="/my-posts"
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >My stories</Link>
                  <button type="button" onClick={async () => { await logout(); navigate("/login", { replace: true }); }} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Sign out</button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    Get started <ArrowRight size={15} />
                  </Link>
                </>
              ))}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className="rounded-xl p-2 text-slate-700 transition hover:bg-slate-100 sm:hidden"
          >
            {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-5 sm:hidden">
            <div className="mb-4 flex gap-2">
              <Search size={18} className="mt-2.5 shrink-0 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search stories..."
                aria-label="Search stories"
                className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <a
                href="#stories"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50"
              >
                Discover stories
              </a>
              <a
                href="#trending"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50"
              >
                Trending
              </a>
              <a
                href="#newsletter"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50"
              >
                Newsletter
              </a>
              {isAuthenticated ? (
                <>
                  <Link to="/write" onClick={() => setMobileMenuOpen(false)} className="mt-2 rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white">Write a story</Link>
                  <Link to="/my-posts" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-slate-700">My stories</Link>
                  {user?.role === "admin" && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-indigo-600">Admin panel</Link>}
                  <button type="button" onClick={async () => { await logout(); setMobileMenuOpen(false); navigate("/login", { replace: true }); }} className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-slate-600">Sign out</button>
                </>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Intro */}
        <section className="mx-auto max-w-7xl px-5 pb-9 pt-12 sm:px-8 sm:pt-16 lg:px-10 lg:pt-20">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700">
                <Sparkles size={14} />A little inspiration for your day
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
                Ideas that move
                <br className="hidden sm:block" />{" "}
                <span className="font-serif italic font-medium text-indigo-600">
                  you forward.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
                Discover fresh perspectives on technology, creativity, work, and
                everything that makes us curious.
              </p>
            </div>

            <a
              href="#stories"
              className="group inline-flex w-fit items-center gap-2 text-sm font-bold text-slate-800 transition hover:text-indigo-600"
            >
              Explore all stories
              <ArrowDownRight
                size={18}
                className="transition-transform group-hover:translate-x-1 group-hover:translate-y-1"
              />
            </a>
          </div>
        </section>

        {/* Featured article */}
        {featuredArticle &&
          !searchQuery &&
          activeCategory === "All stories" && (
            <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 lg:px-10">
              <div className="grid overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
                <Link
                  to={`/posts/${featuredArticle.id}`}
                  className="group relative min-h-[280px] overflow-hidden bg-slate-100 sm:min-h-[380px] lg:min-h-[440px]"
                >
                  <img
                    src={featuredArticle.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                  <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-xs font-bold text-slate-900 shadow-sm sm:left-7 sm:top-7">
                    <Sparkles size={14} className="text-indigo-600" />
                    Editor's pick
                  </span>
                  <span className="absolute bottom-5 left-5 rounded-full bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md sm:bottom-7 sm:left-7">
                    Featured story
                  </span>
                </Link>

                <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
                  <div className="mb-5 flex items-center gap-3 text-xs font-semibold text-slate-500">
                    <span className="rounded-full bg-violet-100 px-3 py-1.5 text-violet-700">
                      {featuredArticle.category}
                    </span>
                    <span>{featuredArticle.date}</span>
                  </div>

                  <Link to={`/posts/${featuredArticle.id}`}>
                    <h2 className="text-2xl font-extrabold leading-tight tracking-tight transition hover:text-indigo-600 sm:text-3xl lg:text-4xl lg:leading-[1.2]">
                      {featuredArticle.title}
                    </h2>
                  </Link>

                  <p className="mt-5 text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
                    {featuredArticle.excerpt}
                  </p>

                  <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
                    <Author
                      initials={featuredArticle.initials}
                      name={featuredArticle.author}
                    />
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock3 size={14} />
                        {featuredArticle.readTime}
                      </span>
                      <Link
                        to={`/posts/${featuredArticle.id}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700"
                        aria-label="Read featured story"
                      >
                        <ArrowUpRight size={19} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

        {/* Stories and trending sidebar */}
        <section
          id="stories"
          className="scroll-mt-24 border-t border-slate-200/70 bg-white py-12 sm:py-16"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                  The reading room
                </p>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Explore stories
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Thoughtful ideas from people worth listening to.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <TrendingUp size={17} className="text-indigo-600" />
                Fresh perspectives, every week
              </div>
            </div>

            {/* Category filters */}
            <div className="mb-9 flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
                    activeCategory === category
                      ? "bg-slate-900 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-12">
              <div>
                {searchQuery && (
                  <p className="mb-5 text-sm text-slate-500">
                    Search results for{" "}
                    <span className="font-semibold text-slate-900">
                      "{searchQuery}"
                    </span>
                  </p>
                )}

                {filteredArticles.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:gap-6">
                    {filteredArticles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        saved={savedArticles.includes(article.id)}
                        onSave={toggleSave}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                    <Search size={28} className="mx-auto text-slate-400" />
                    <h3 className="mt-4 text-lg font-bold">No stories found</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Try another search or choose a different category.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveCategory("All stories");
                      }}
                      className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Clear filters
                    </button>
                  </div>
                )}

                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setSearchQuery((query) => query)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
                  >
                    Explore more stories
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="space-y-6">
                <div
                  id="trending"
                  className="scroll-mt-24 rounded-2xl border border-slate-200 bg-[#fafaf9] p-5 sm:p-6"
                >
                  <div className="mb-6 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <Flame size={19} />
                    </span>
                    <div>
                      <h3 className="font-bold">Trending reads</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Worth your time
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {trending.map((item) => (
                      <Link
                        key={item.id}
                        to={`/posts/${item.id}`}
                        className="group flex gap-3"
                      >
                        <span className="pt-0.5 font-serif text-2xl text-slate-300 transition group-hover:text-indigo-600">
                          {item.number}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold leading-6 text-slate-800 transition group-hover:text-indigo-600">
                            {item.title}
                          </h4>
                          <p className="mt-1 text-xs text-slate-400">
                            {item.time}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl bg-slate-950 p-6 text-white">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                    <BookOpen size={20} />
                  </span>
                  <h3 className="mt-5 text-xl font-bold leading-snug">
                    Your ideas deserve a place here.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Start writing, share what you know, and find readers who
                    care about your perspective.
                  </p>
                  <Link
                    to={isAuthenticated ? "/write" : "/register"}
                    className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-indigo-50"
                  >
                    Start writing <ArrowRight size={16} />
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section
          id="newsletter"
          className="scroll-mt-24 bg-indigo-50/70 px-5 py-16 sm:px-8 sm:py-20 lg:px-10"
        >
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
              <BookOpen size={22} />
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Good ideas, delivered.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Get a thoughtful selection of stories and fresh perspectives in
              your inbox. No noise, just good reading.
            </p>
            <NewsletterForm />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BookOpen size={17} />
            </span>
            <span className="font-extrabold tracking-tight">
              Inkline<span className="text-indigo-600">.</span>
            </span>
          </Link>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Inkline. Made for curious minds.
          </p>
          <div className="flex flex-wrap gap-5 text-xs font-medium text-slate-500">
            <Link to="/about" className="hover:text-indigo-600">
              About
            </Link>
            <Link to="/privacy" className="hover:text-indigo-600">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-indigo-600">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    // Connect this handler to your newsletter API or email provider.
    setSubmitted(true);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-7 flex max-w-lg flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setSubmitted(false);
        }}
        placeholder="Enter your email address"
        aria-label="Email address for newsletter"
        className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700"
      >
        Subscribe <ArrowRight size={16} />
      </button>
      {submitted && (
        <p role="status" className="text-sm text-emerald-700 sm:basis-full">
          Thanks for your interest! Connect this form to your newsletter service
          to complete your subscription.
        </p>
      )}
    </form>
  );
}
