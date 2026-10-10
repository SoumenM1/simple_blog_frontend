import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageSquare, RefreshCw, Trash2 } from "lucide-react";
import { api } from "../../src/services/api";

const PAGE_SIZE = 20;
export default function CommentsPage() {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await api.get("/admin/comments", { params: { page, limit: PAGE_SIZE } });
      const payload = response.data?.data ?? response.data;
      setComments(Array.isArray(payload.comments) ? payload.comments : []);
      setTotal(Number(payload.pagination?.total ?? payload.total ?? 0));
    } catch (err) { setError(err.response?.data?.message || "Unable to load comments."); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => { load(); }, [load]);
  const remove = async (comment) => {
    if (!window.confirm("Move this comment to trash?")) return;
    setBusyId(comment._id); setError(""); setNotice("");
    try { await api.delete(`/admin/comments/${comment._id}`); setNotice("Comment moved to trash."); await load(); }
    catch (err) { setError(err.response?.data?.message || "Unable to delete comment."); }
    finally { setBusyId(""); }
  };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"><ArrowLeft size={16}/> Back to dashboard</Link>
    <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-500">Inkline / Admin</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Comments</h1><p className="mt-2 text-sm text-slate-500">Review and moderate community discussions.</p></div><button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold"><RefreshCw size={16}/> Refresh</button></div>
    {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</p>}
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><MessageSquare size={20}/></span><div><p className="font-bold text-slate-900">All comments</p><p className="text-xs text-slate-500">{total.toLocaleString()} comments</p></div></div></div>
      {loading ? <p className="p-8 text-center text-sm text-slate-500">Loading comments…</p> : comments.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No comments to display.</p> : <div className="divide-y divide-slate-100">{comments.map((comment) => <article key={comment._id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{comment.author?.name || "Unknown user"}<span className="ml-2 text-xs font-normal text-slate-400">{comment.author?.email || ""}</span></p><p className="mt-1 text-xs text-indigo-600">On: {comment.post?.title || "Deleted/unavailable post"}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{comment.content}</p><p className="mt-2 text-xs text-slate-400">{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "Date unavailable"}</p></div><button disabled={busyId === comment._id} onClick={() => remove(comment)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={15}/>{busyId === comment._id ? "Deleting…" : "Delete"}</button></article>)}</div>}
      <div className="flex items-center justify-between border-t border-slate-100 p-4"><span className="text-xs text-slate-500">Page {page} of {totalPages}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Previous</button><button disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Next</button></div></div>
    </section></div></main>;
}
