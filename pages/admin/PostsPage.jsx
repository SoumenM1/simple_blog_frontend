import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  CheckCircle2,
  Clock3,
  XCircle,
  Plus,
  PenLine,
  ExternalLink,
  AlertCircle,
  X,
} from "lucide-react";
import { api } from "../../src/services/api";

const PAGE_SIZE = 10;

const statusStyles = {
  published: "bg-emerald-50 text-emerald-700",
  draft: "bg-amber-50 text-amber-700",
  archived: "bg-slate-100 text-slate-600",
  pending: "bg-blue-50 text-blue-700",
};

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

function normalizePost(post) {
  return {
    ...post,
    id: post._id || post.id,
    title: post.title || "Untitled post",
    status: (post.status || "draft").toLowerCase(),
    authorName:
      post.author?.name ||
      post.authorName ||
      (typeof post.author === "string" ? post.author : "Unknown author"),
    categoryName:
      post.category?.name ||
      post.categoryName ||
      post.category ||
      "Uncategorized",
  };
}

function StatusBadge({ status }) {
  const normalized = statusStyles[status]
    ? status
    : "draft";

  const Icon =
    normalized === "published"
      ? CheckCircle2
      : normalized === "pending"
        ? Clock3
        : normalized === "archived"
          ? XCircle
          : FileText;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[normalized]}`}
    >
      <Icon size={13} />
      {normalized}
    </span>
  );
}

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [actionPost, setActionPost] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
    
      const response = await api.get("/admin/posts", {
        params: {
          page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });

      const data = response.data?.data ?? response.data;
      const results = Array.isArray(data)
        ? data
        : data.posts || data.results || [];

      setPosts(results.map(normalizePost));
      setTotalPosts(Number(data.total ?? data.pagination?.total ?? data.totalPosts ?? results.length));
    } catch (err) {
      setPosts([]);
      setTotalPosts(0);
      setError(
        err.response?.data?.message ||
          "Unable to load posts. Check your admin API endpoint."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE));
  const firstItem = totalPosts === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, totalPosts);

  const categories = [
    ...new Set(
      posts
        .map((post) => post.categoryName)
        .filter((category) => category && category !== "Uncategorized")
    ),
  ];

  const changeStatus = async (post, status) => {
    if (!post?.id) return;

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      // Adjust this endpoint if your backend uses a different route.
      await api.patch(`/admin/posts/${post.id}/status`, { status });

      setNotice(`"${post.title}" status updated to ${status}.`);
      setActionPost(null);
      await fetchPosts();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update post status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const deletePost = async (post) => {
    if (!post?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${post.title}"?`
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      await api.delete(`/admin/posts/${post.id}`);

      setNotice(`"${post.title}" was deleted.`);
      setActionPost(null);
      await fetchPosts();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete this post."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm text-slate-500">
              Inkline / Admin / Posts
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Posts
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage articles, review drafts, and control publication status.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchPosts}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              to="/write"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Plus size={17} />
              Create post
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {notice && (
          <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={fetchPosts}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Matching posts",
              value: totalPosts,
              icon: FileText,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Published on page",
              value: posts.filter((post) => post.status === "published").length,
              icon: CheckCircle2,
              color: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "Drafts on page",
              value: posts.filter((post) => post.status === "draft").length,
              icon: Clock3,
              color: "bg-amber-50 text-amber-600",
            },
            {
              label: "Categories on page",
              value: categories.length,
              icon: FileText,
              color: "bg-violet-50 text-violet-600",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    {item.label}
                  </p>
                  <span className={`rounded-xl p-2.5 ${item.color}`}>
                    <Icon size={20} />
                  </span>
                </div>

                <h2 className="mt-3 text-3xl font-bold text-slate-900">
                  {loading ? "—" : item.value.toLocaleString()}
                </h2>
              </div>
            );
          })}
        </section>

        {/* Posts table */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="font-bold text-slate-900">All posts</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search and filter articles by status or category.
            </p>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_210px]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title or author..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter posts by status"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="pending">Pending</option>
                <option value="archived">Archived</option>
              </select>


            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Article</th>
                  <th className="px-4 py-4 font-semibold">Author</th>
                  <th className="px-4 py-4 font-semibold">Category</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Created</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={6} className="px-6 py-5">
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <FileText size={22} />
                      </div>
                      <h3 className="mt-4 font-semibold text-slate-900">
                        No posts found
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your filters or create a new article.
                      </p>
                      <Link
                        to="/write"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                      >
                        <Plus size={16} /> Create post
                      </Link>
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr
                      key={post.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="max-w-[280px] px-6 py-4">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {post.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {post.slug || post.id}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {post.authorName}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {post.categoryName}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={post.status} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                        {formatDate(post.createdAt)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={
                              post.slug
                                ? `/posts/${post.slug}`
                                : `/posts/${post.id}`
                            }
                            title="View article"
                            aria-label={`View ${post.title}`}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Eye size={16} />
                          </Link>

                          {/* <Link
                            to={`/write?edit=${post.id}`}
                            title="Edit article"
                            aria-label={`Edit ${post.title}`}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            <ExternalLink size={16} />
                          </Link> */}

                          <button
                            type="button"
                            title="Manage article"
                            aria-label={`Manage ${post.title}`}
                            onClick={() => setActionPost(post)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            <FileText size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">{firstItem}</span>
              {" "}to{" "}
              <span className="font-semibold text-slate-800">{lastItem}</span>
              {" "}of{" "}
              <span className="font-semibold text-slate-800">{totalPosts}</span>
              {" "}posts
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="px-2 text-sm text-slate-500">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Post management modal */}
      {actionPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setActionPost(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-actions-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="post-actions-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Manage post
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {actionPost.title}
                </p>
              </div>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setActionPost(null)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Current status</p>
              <div className="mt-2">
                <StatusBadge status={actionPost.status} />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <Link
                to={`/write?edit=${encodeURIComponent(actionPost.id)}&admin=1`}
                onClick={() => setActionPost(null)}
                className="flex w-full items-center gap-3 rounded-xl border border-indigo-200 p-4 text-left transition hover:bg-indigo-50"
              >
                <PenLine size={19} className="text-indigo-600" />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Edit post
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Update this article's title, content, category, and tags
                  </span>
                </span>
              </Link>

              {actionPost.status !== "published" && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => changeStatus(actionPost, "published")}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <CheckCircle2 size={19} className="text-emerald-600" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Publish post
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Make the article publicly available
                    </span>
                  </span>
                </button>
              )}

              {actionPost.status === "published" && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => changeStatus(actionPost, "draft")}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <Clock3 size={19} className="text-amber-600" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Move to draft
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Remove the post from public publication
                    </span>
                  </span>
                </button>
              )}

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => deletePost(actionPost)}
                className="flex w-full items-center gap-3 rounded-xl border border-red-200 p-4 text-left transition hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={19} className="text-red-600" />
                <span>
                  <span className="block text-sm font-semibold text-red-700">
                    Delete post
                  </span>
                  <span className="mt-1 block text-xs text-red-500">
                    Permanently delete this article
                  </span>
                </span>
              </button>
            </div>

            {actionLoading && (
              <p className="mt-4 text-center text-sm text-slate-500">
                Updating post...
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
