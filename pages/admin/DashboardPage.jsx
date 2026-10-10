import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquare,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { api } from "../../src/services/api";

const initialStats = [
  {
    label: "Total Posts",
    value: "—",
    change: "All blog articles",
    icon: BookOpen,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Registered Users",
    value: "—",
    change: "Community members",
    icon: Users,
    color: "bg-violet-50 text-violet-600",
  },
  {
    label: "Published Posts",
    value: "—",
    change: "Live articles",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Total Comments",
    value: "—",
    change: "Community discussion",
    icon: MessageSquare,
    color: "bg-amber-50 text-amber-600",
  },
];

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ stat }) {
  const Icon = stat.icon;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {stat.label}
          </p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {stat.value}
          </h3>
        </div>

        <div className={`rounded-xl p-3 ${stat.color}`}>
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{stat.change}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(initialStats);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
     
      const [dashboardResponse, postsResponse] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/posts", { params: { page: 1, limit: 5 } }),
      ]);
      const data = dashboardResponse.data?.data ?? dashboardResponse.data;
      const postsPayload = postsResponse.data?.data ?? postsResponse.data;

      setStats([
        {
          ...initialStats[0],
          value: Number(data.posts ?? data.totalPosts ?? 0).toLocaleString(),
        },
        {
          ...initialStats[1],
          value: Number(data.users ?? data.totalUsers ?? 0).toLocaleString(),
        },
        {
          ...initialStats[2],
          value: Number(data.publishedPosts ?? 0).toLocaleString(),
        },
        {
          ...initialStats[3],
          label: "Total Comments",
          change: "Community discussion",
          icon: MessageSquare,
          value: Number(data.comments ?? data.totalComments ?? 0).toLocaleString(),
        },
      ]);

      setPosts(Array.isArray(data.recentPosts) ? data.recentPosts : (postsPayload.posts || []));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data. Check your admin API endpoint."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const displayedPosts = posts.length > 0 ? posts : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <span>Inkline</span>
              <span>/</span>
              <span className="font-medium text-slate-700">Admin</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your blog, content, and community from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              to="/write"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Plus size={17} />
              Create post
            </Link>
          </div>
        </div>

        {/* API error */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <Activity size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Dashboard data unavailable</p>
              <p className="mt-1">{error}</p>
              <p className="mt-1 text-xs">
                Confirm that your backend implements GET /admin/dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Statistics */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Overview
            </h2>
            {loading && (
              <span className="text-xs text-slate-400">Loading data...</span>
            )}
          </div>

          <div className="mb-4 flex justify-end"><Link to="/admin/comments" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600"><MessageSquare size={16}/> Manage comments</Link></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </section>

        {/* Main content */}
        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          {/* Recent posts */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white xl:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="font-bold text-slate-900">Recent posts</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your latest content
                </p>
              </div>

              <Link
                to="/admin/posts"
                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-black"
              >
                View posts <ArrowRight size={15} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-14 animate-pulse rounded-lg bg-slate-100"
                  />
                ))}
              </div>
            ) : displayedPosts.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <FileText size={22} />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">
                  No recent posts
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Create your first article to get started.
                </p>
                <Link
                  to="/write"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  <Plus size={16} /> Write a post
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Article</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {displayedPosts.slice(0, 6).map((post) => {
                      const published = post.status === "published";

                      return (
                        <tr key={post._id || post.id}>
                          <td className="max-w-[260px] px-6 py-4">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {post.title || "Untitled post"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              By {post.author?.name || post.author || "Admin"}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                published
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  published
                                    ? "bg-emerald-500"
                                    : "bg-amber-500"
                                }`}
                              />
                              {post.status || "draft"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                            {formatDate(post.createdAt)}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <Link
                              to={
                                post.slug
                                  ? `/posts/${post.slug}`
                                  : `/posts/${post._id || post.id}`
                              }
                              className="text-sm font-semibold text-slate-700 hover:text-black"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Quick actions */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-900">Quick actions</h2>
              <p className="mt-1 text-sm text-slate-500">
                Common administrative tasks
              </p>

              <div className="mt-5 space-y-3">
                <Link
                  to="/write"
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <span className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                    <Plus size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-800">
                      Create article
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Write and publish content
                    </span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-slate-400 transition group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  to="/admin/posts"
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <span className="rounded-lg bg-violet-50 p-2.5 text-violet-600">
                    <FileText size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-800">
                      Manage posts
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Edit drafts and articles
                    </span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-slate-400 transition group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  to="/admin/users"
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <span className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                    <Users size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-800">
                      Manage users
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Review your community
                    </span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-slate-400 transition group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </section>

            {/* Publishing summary */}
            <section className="rounded-2xl bg-slate-900 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-white/10 p-2.5">
                  <Activity size={20} />
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                  Content
                </span>
              </div>

              <h3 className="mt-5 text-lg font-bold">Keep your blog active</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Publish helpful articles consistently to keep readers engaged
                and grow your community.
              </p>

              <Link
                to="/write"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                Write an article <ArrowUpRight size={16} />
              </Link>
            </section>

            {/* Activity note */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                  <MessageSquare size={19} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Community moderation
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Review comments and user reports regularly.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Inkline Admin</p>
          <p className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Dashboard interface ready
          </p>
        </footer>
      </main>
    </div>
  );
}
