
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Clock3,
  Heart,
  MessageCircle,
  Share2,
  UserRound,
    BookOpen,
    ArrowRight,
} from "lucide-react";
import { api } from "../src/services/api";
import { useAuth } from "../context/AuthContext";

export default function PostDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchPost() {
      setLoading(true);
      setError("");
      setPost(null);

      try {
        // Change this endpoint if your backend uses a different route.
        const response = await api.get(
          `/posts/${encodeURIComponent(slug)}`
        );

        const result = response.data?.data?.post ?? response.data?.post ?? response.data?.data ?? response.data;

        if (!cancelled) {
          if (result && typeof result === "object") {
            setPost(result);
          } else {
            setError("This article could not be found.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.status === 404
              ? "This article does not exist or has been removed."
              : err.response?.data?.message ||
                  "Unable to load this article. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (slug) {
      fetchPost();
    } else {
      setError("No article was specified.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!post?._id) return;
    let active = true;
    setCommentsLoading(true);
    api.get(`/posts/${post._id}/comments`, { params: { page: 1, limit: 50 } })
      .then((response) => {
        const payload = response.data?.data ?? response.data;
        if (active) setComments(Array.isArray(payload?.comments) ? payload.comments : []);
      })
      .catch((err) => { if (active) setCommentError(err.response?.data?.message || "Unable to load comments."); })
      .finally(() => { if (active) setCommentsLoading(false); });
    return () => { active = false; };
  }, [post?._id]);

  const submitComment = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) { navigate("/login", { state: { from: { pathname: location.pathname } } }); return; }
    const content = commentText.trim();
    if (!content) return;
    setCommentBusy(true); setCommentError("");
    try {
      const response = await api.post(`/posts/${post._id}/comments`, { content });
      const payload = response.data?.data ?? response.data;
      if (payload?.comment) setComments((previous) => [...previous, payload.comment]);
      setCommentText("");
    } catch (err) { setCommentError(err.response?.data?.message || "Unable to add your comment."); }
    finally { setCommentBusy(false); }
  };

  const saveCommentEdit = async (commentId) => {
    const content = editingCommentText.trim();
    if (!content) return;
    setCommentBusy(true); setCommentError("");
    try {
      const response = await api.put(`/posts/comments/${commentId}`, { content });
      const payload = response.data?.data ?? response.data;
      if (payload?.comment) setComments((previous) => previous.map((item) => String(item._id) === String(commentId) ? payload.comment : item));
      setEditingCommentId(null); setEditingCommentText("");
    } catch (err) { setCommentError(err.response?.data?.message || "Unable to update this comment."); }
    finally { setCommentBusy(false); }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    setCommentBusy(true); setCommentError("");
    try {
      await api.delete(`/posts/comments/${commentId}`);
      setComments((previous) => previous.filter((item) => String(item._id) !== String(commentId)));
    } catch (err) { setCommentError(err.response?.data?.message || "Unable to delete this comment."); }
    finally { setCommentBusy(false); }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title || "Inkline article",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Unable to share this article.");
      }
    }
  };

  const author =
    typeof post?.author === "object" ? post.author : null;

  const authorName =
    author?.name || post?.authorName || "Inkline Author";

  const authorAvatar =
    author?.avatar || author?.profileImage || post?.authorAvatar;

  const coverImage =
    post?.coverImage ||
    post?.featuredImage ||
    post?.thumbnail ||
    post?.image;

  const content = post?.content || post?.body || post?.text || "";

  const publishedDate = post?.publishedAt || post?.createdAt;

  const formattedDate = publishedDate
    ? new Date(publishedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently published";

  const readingTime =
    post?.readingTime ||
    `${Math.max(
      1,
      Math.ceil(
        String(content)
          .replace(/<[^>]*>/g, " ")
          .trim()
          .split(/\s+/)
          .filter(Boolean).length / 200
      )
    )} min read`;

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f9fc] px-5">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="mt-4 text-sm text-slate-500">
            Loading your story...
          </p>
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f9fc] px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <MessageCircle size={26} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Story unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error || "We couldn't find this article."}
          </p>

          <button
            onClick={() => navigate("/")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <ArrowLeft size={17} />
            Back to stories
          </button>
        </div>
      </main>
    );
  }

  const tags = Array.isArray(post.tags) ? post.tags : [];

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <span className="text-lg font-bold">I</span>
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Inkline<span className="text-indigo-600">.</span>
            </span>
          </Link>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">Go back</span>
          </button>
        </div>
      </header>

      {/* Article */}
      <article className="mx-auto max-w-4xl px-5 pb-20 pt-10 sm:px-8 sm:pt-16">
        {/* Category */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700">
            {post.category?.name ||
              (typeof post.category === "string"
                ? post.category
                : "Stories")}
          </span>

          {post.status === "draft" && (
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Draft
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          {post.title || "Untitled story"}
        </h1>

        {post.excerpt && (
          <p className="mt-6 text-lg leading-8 text-slate-500 sm:text-xl">
            {post.excerpt}
          </p>
        )}

        {/* Author and metadata */}
        <div className="mt-8 flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <UserRound size={23} />
              </div>
            )}

            <div>
              <p className="font-bold text-slate-900">
                {authorName}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={13} />
                  {formattedDate}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Clock3 size={13} />
                  {readingTime}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLiked((value) => !value)}
              aria-pressed={liked}
              aria-label={liked ? "Unlike article" : "Like article"}
              className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
                liked
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Heart size={17} fill={liked ? "currentColor" : "none"} />
              {liked ? "Liked" : "Like"}
            </button>

            <button
              type="button"
              onClick={() => setBookmarked((value) => !value)}
              aria-pressed={bookmarked}
              aria-label={
                bookmarked ? "Remove bookmark" : "Bookmark article"
              }
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                bookmarked
                  ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Bookmark
                size={17}
                fill={bookmarked ? "currentColor" : "none"}
              />
            </button>

            <button
              type="button"
              onClick={handleShare}
              aria-label="Share article"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <Share2 size={17} />
            </button>
          </div>
        </div>

        {copied && (
          <p role="status" className="mt-3 text-right text-sm text-emerald-700">
            Article link copied.
          </p>
        )}

        {/* Cover image */}
        {coverImage && (
          <figure className="mt-8 overflow-hidden rounded-3xl bg-slate-100">
            <img
              src={coverImage}
              alt={post.title || "Article cover"}
              className="max-h-[560px] w-full object-cover"
            />
          </figure>
        )}

        {/* Article content */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_200px]">
          <div
            className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 prose-img:rounded-2xl prose-p:text-[17px] prose-p:leading-8"
          >
            {content ? (
              <div className="whitespace-pre-wrap break-words leading-8 text-slate-700">
                {content}
              </div>
            ) : (
              <p className="text-slate-500">
                This article does not have any content yet.
              </p>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {tags.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-bold text-slate-900">
                  Topics
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag, index) => {
                    const label =
                      typeof tag === "string" ? tag : tag.name;

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
              </section>
            )}

            <section className="rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <BookOpen size={20} />
              </div>

              <h2 className="mt-4 text-lg font-bold">
                Enjoyed this story?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Discover more ideas and perspectives from the Inkline
                community.
              </p>

              <Link
                to="/"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 transition hover:text-white"
              >
                Explore stories
                <ArrowUpRight size={16} />
              </Link>
            </section>
          </aside>
        </div>

        {/* Comments */}
        <section className="mt-14 border-t border-slate-200 pt-10" aria-labelledby="comments-heading">
          <div className="mb-6 flex items-center gap-3">
            <MessageCircle className="text-indigo-600" size={22} />
            <h2 id="comments-heading" className="text-2xl font-bold">Discussion <span className="text-slate-400">({comments.length})</span></h2>
          </div>
          {commentError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{commentError}</p>}
          <form onSubmit={submitComment} className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <label htmlFor="comment-content" className="mb-2 block text-sm font-semibold text-slate-800">Add to the conversation</label>
            <textarea id="comment-content" value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={3000} rows={3} placeholder={isAuthenticated ? "Share a thoughtful comment…" : "Sign in to leave a comment…"} className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">{commentText.length}/3000</span>
              <button disabled={commentBusy || !commentText.trim()} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{commentBusy ? "Saving…" : "Post comment"}</button>
            </div>
          </form>
          {commentsLoading ? <p className="py-6 text-sm text-slate-500">Loading comments…</p> : comments.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No comments yet. Start the discussion.</p> : <div className="space-y-4">
            {comments.map((comment) => {
              const commentAuthor = typeof comment.author === "object" ? comment.author : null;
              const ownComment = user && String(user._id || user.id) === String(commentAuthor?._id || comment.author);
              const canManage = ownComment || user?.role === "admin";
              return <article key={comment._id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-700">{(commentAuthor?.name || "U").charAt(0).toUpperCase()}</div>
                    <div><p className="font-semibold text-slate-900">{commentAuthor?.name || "Inkline user"}</p><p className="text-xs text-slate-400">{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "Just now"}</p></div>
                  </div>
                  {canManage && <div className="flex gap-2">{ownComment && <button type="button" onClick={() => { setEditingCommentId(comment._id); setEditingCommentText(comment.content); }} className="text-xs font-semibold text-indigo-600 hover:underline">Edit</button>}<button type="button" disabled={commentBusy} onClick={() => deleteComment(comment._id)} className="text-xs font-semibold text-rose-600 hover:underline">Delete</button></div>}
                </div>
                {editingCommentId === comment._id ? <div className="mt-4"><textarea value={editingCommentText} onChange={(event) => setEditingCommentText(event.target.value)} rows={3} maxLength={3000} className="w-full rounded-xl border border-slate-200 p-3 text-sm"/><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setEditingCommentId(null)} className="rounded-lg px-3 py-2 text-sm text-slate-600">Cancel</button><button type="button" disabled={commentBusy || !editingCommentText.trim()} onClick={() => saveCommentEdit(comment._id)} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button></div></div> : <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{comment.content}</p>}
              </article>;
            })}
          </div>}
        </section>

        {/* Footer action */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">
              That’s the story.
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Keep exploring ideas on Inkline.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            More stories
            <ArrowRight size={17} />
          </Link>
        </div>
      </article>

      <footer className="border-t border-slate-200 bg-white py-7">
        <p className="text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Inkline. Stories worth sharing.
        </p>
      </footer>
    </main>
  );
}