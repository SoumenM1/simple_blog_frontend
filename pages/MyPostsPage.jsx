
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileEdit,
  FileText,
  LoaderCircle,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {api} from "../src/services/api";

const FILTERS = ["All posts", "Published", "Drafts"];

function getPostStatus(post) {
  return String(post.status || "published").toLowerCase();
}

function getPostId(post) {
  return post._id || post.id || post.slug;
}

function getPostSlug(post) {
  return post.slug || post._id || post.id;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PostCard({ post, onDelete, onPublish, busyId }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const id = getPostId(post);
  const status = getPostStatus(post);
  const isDraft = status === "draft";
  const busy = busyId === String(id);
  const title = post.title || "Untitled story";

  const content = String(
    post.excerpt || post.content || post.body || ""
  ).replace(/<[^>]*>/g, " ");

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const coverImage =
    post.coverImage || post.featuredImage || post.thumbnail || post.image;

  return (
    <article className="group overflow-visible rounded-2xl border border-slate-200 bg-white transition hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/40">
      {coverImage && (
        <Link
          to={`/posts/${getPostSlug(post)}`}
          className="block overflow-hidden rounded-t-2xl bg-slate-100"
        >
          <img
            src={coverImage}
            alt={title}
            className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        </Link>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              isDraft
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {isDraft ? (
              <FileEdit size={13} />
            ) : (
              <CheckCircle2 size={13} />
            )}
            {isDraft ? "Draft" : "Published"}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={`Actions for ${title}`}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
            >
              <MoreHorizontal size={20} />
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close actions menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />

                <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <Link
                    to={`/write?edit=${encodeURIComponent(id)}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <PenLine size={15} />
                    Edit post
                  </Link>

                  {isDraft ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onPublish(post);
                      }}
                      disabled={busy}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Send size={15} />
                      Publish draft
                    </button>
                  ) : (
                    <Link
                      to={`/posts/${getPostSlug(post)}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowUpRight size={15} />
                      View article
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(post);
                    }}
                    disabled={busy}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Delete post
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <Link to={`/posts/${getPostSlug(post)}`} className="block">
          <h2 className="mt-4 line-clamp-2 text-xl font-bold leading-snug tracking-tight text-slate-900 transition group-hover:text-indigo-700">
            {title}
          </h2>
        </Link>

        <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-500">
          {post.excerpt || post.content || post.body || "No description added yet."}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} />
            {formatDate(post.publishedAt || post.updatedAt || post.createdAt)}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={14} />
            {Math.max(1, Math.ceil(wordCount / 200))} min read
          </span>
        </div>

        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag, index) => {
              const label = typeof tag === "string" ? tag : tag.name;

              return (
                <span
                  key={tag._id || label || index}
                  className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600"
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-400">
            {typeof post.category === "object"
              ? post.category?.name || "General"
              : post.category || "General"}
          </span>

          {busy ? (
            <LoaderCircle
              size={17}
              className="animate-spin text-indigo-600"
            />
          ) : (
            <Link
              to={`/posts/${getPostSlug(post)}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View story
              <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MyPostsPage() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("All posts");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Assumes GET /posts/my-posts returns the current user's posts.
      const response = await api.get("/posts/my-posts");

      const data = response.data;
      const payload = data?.data ?? data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.posts || payload?.data?.posts || [];

      if (!Array.isArray(list)) {
        throw new Error("The server returned an unexpected posts format.");
      }

      setPosts(list);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Please sign in to view your posts.");
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load your posts. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      const status = getPostStatus(post);

      const matchesFilter =
        filter === "All posts" ||
        (filter === "Published" && status === "published") ||
        (filter === "Drafts" && status === "draft");

      const matchesSearch =
        !query ||
        [post.title, post.excerpt, post.content, post.category]
          .map((value) =>
            typeof value === "object" ? value?.name || "" : value || ""
          )
          .some((value) => String(value).toLowerCase().includes(query)) ||
        (Array.isArray(post.tags) &&
          post.tags.some((tag) =>
            String(typeof tag === "string" ? tag : tag.name || "")
              .toLowerCase()
              .includes(query)
          ));

      return matchesFilter && matchesSearch;
    });
  }, [posts, filter, search]);

  const counts = useMemo(
    () => ({
      all: posts.length,
      published: posts.filter(
        (post) => getPostStatus(post) === "published"
      ).length,
      drafts: posts.filter((post) => getPostStatus(post) === "draft").length,
    }),
    [posts]
  );

  const publishPost = async (post) => {
    const id = getPostId(post);

    if (!id) {
      setError("This post has no identifier, so it cannot be published.");
      return;
    }

    setBusyId(String(id));
    setError("");
    setNotice("");

    try {
      // Assumes PUT /posts/:id accepts { status: "published" }.
      await api.put(`/posts/${id}`, { status: "published" });

      setPosts((previous) =>
        previous.map((item) =>
          String(getPostId(item)) === String(id)
            ? { ...item, status: "published" }
            : item
        )
      );

      setNotice("Your story has been published.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not publish this draft. Check your backend endpoint."
      );
    } finally {
      setBusyId("");
    }
  };

  const deletePost = async () => {
    if (!deleteTarget) return;

    const id = getPostId(deleteTarget);

    if (!id) {
      setError("This post has no identifier and cannot be deleted.");
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    setError("");
    setNotice("");

    try {
     
      await api.delete(`/posts/${id}`);

      setPosts((previous) =>
        previous.filter(
          (post) => String(getPostId(post)) !== String(id)
        )
      );

      setNotice("Post deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete this post. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <BookOpen size={20} />
            </span>

            <span className="text-xl font-extrabold tracking-tight">
              Inkline<span className="text-indigo-600">.</span>
            </span>
          </Link>

          <Link
            to="/write"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">Write a story</span>
            <span className="sm:hidden">Write</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        {/* Page title */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.15em] text-indigo-600">
              YOUR WORKSPACE
            </p>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              My stories
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage your writing, polish your drafts, and keep your ideas
              moving forward.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPosts}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
          >
            <LoaderCircle
              size={16}
              className={loading ? "animate-spin" : "hidden"}
            />
            Refresh posts
          </button>
        </div>

        {/* Summary cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "All stories",
              count: counts.all,
              icon: FileText,
              iconClass: "bg-indigo-50 text-indigo-600",
            },
            {
              label: "Published",
              count: counts.published,
              icon: CheckCircle2,
              iconClass: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "Drafts",
              count: counts.drafts,
              icon: FileEdit,
              iconClass: "bg-amber-50 text-amber-600",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    {item.label}
                  </span>

                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconClass}`}
                  >
                    <Icon size={20} />
                  </span>
                </div>

                <p className="mt-4 text-3xl font-extrabold tracking-tight">
                  {item.count}
                </p>
              </div>
            );
          })}
        </div>

        {/* Search and filters */}
        <section className="mt-9">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => {
                const active = filter === item;
                const count =
                  item === "All posts"
                    ? counts.all
                    : item === "Published"
                      ? counts.published
                      : counts.drafts;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs ${
                        active
                          ? "bg-white/15 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:max-w-xs">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your stories..."
                aria-label="Search your stories"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>
        </section>

        {/* Notices */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <CheckCircle2 size={17} />
            {notice}
          </div>
        )}

        {/* Post list */}
        <section className="mt-7">
          {loading ? (
            <div className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white">
              <div className="text-center">
                <LoaderCircle
                  size={32}
                  className="mx-auto animate-spin text-indigo-600"
                />
                <p className="mt-3 text-sm text-slate-500">
                  Loading your stories...
                </p>
              </div>
            </div>
          ) : error && posts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
              <h2 className="text-xl font-bold">Could not load your stories</h2>
              <p className="mt-2 text-sm text-slate-500">
                Check your login session and posts API endpoint.
              </p>

              <button
                type="button"
                onClick={fetchPosts}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Try again
              </button>
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredPosts.map((post, index) => (
                <PostCard
                  key={getPostId(post) || index}
                  post={post}
                  onDelete={setDeleteTarget}
                  onPublish={publishPost}
                  busyId={busyId}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                {search ? <Search size={28} /> : <FileText size={28} />}
              </div>

              <h2 className="mt-5 text-xl font-bold">
                {search
                  ? "No matching stories"
                  : filter === "Drafts"
                    ? "No drafts yet"
                    : filter === "Published"
                      ? "No published stories yet"
                      : "Your writing journey starts here"}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {search
                  ? "Try a different title, category, or tag."
                  : "Create your first story and it will appear here when the server returns it."}
              </p>

              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-5 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
                >
                  Clear search
                </button>
              ) : (
                <Link
                  to="/write"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <PenLine size={17} />
                  Write your first story
                </Link>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>

            <h2 id="delete-title" className="mt-5 text-xl font-bold">
              Delete this story?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              “{deleteTarget.title || "Untitled story"}” will be removed.
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deletePost}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}
                Delete story
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}