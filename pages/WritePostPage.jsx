import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  ImagePlus,
  LoaderCircle,
  PenLine,
  Send,
  Save,
  Tag,
  X,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { api } from "../src/services/api";

const INITIAL_FORM = {
  title: "",
  excerpt: "",
  content: "",
  category: "Technology",
  coverImage: "",
  tags: [],
};

const CATEGORIES = [
  "Technology",
  "Programming",
  "AI & Machine Learning",
  "Lifestyle",
  "Business",
  "Education",
  "Productivity",
  "Personal Growth",
  "Design",
  "Health & Wellness",
  "Food & Cooking",
  "Finance",
  "Science",
  "Entertainment",
  "Sports",
  "Politics",
];

export default function WritePostPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const adminMode = searchParams.get("admin") === "1";

  const [form, setForm] = useState(INITIAL_FORM);
  const [tagInput, setTagInput] = useState("");
  const [mode, setMode] = useState("editor");
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!editId) return;
    let active = true;

    const loadPost = async () => {
      try {
        let post;
        if (adminMode) {
          // Admin APIs may expose a detail endpoint or a paginated collection.
          try {
            const detailResponse = await api.get(`/admin/posts/${editId}`);
            const detailPayload =
              detailResponse.data?.data ?? detailResponse.data;
            post = detailPayload?.post ?? detailPayload;
          } catch (detailError) {
            if (detailError.response?.status !== 404) throw detailError;
            const listResponse = await api.get("/admin/posts", {
              params: { page: 1, limit: 1000 },
            });
            const listPayload = listResponse.data?.data ?? listResponse.data;
            const posts = Array.isArray(listPayload)
              ? listPayload
              : (listPayload?.posts ?? listPayload?.results ?? []);
            post = posts.find(
              (item) => String(item._id || item.id) === String(editId),
            );
          }
        } else {
          const response = await api.get("/posts/my-posts");
          const payload = response.data?.data ?? response.data;
          const posts = payload?.posts ?? [];
          post = posts.find(
            (item) => String(item._id || item.id) === String(editId),
          );
        }

        if (!active) return;
        if (!post) {
          setError("Post not found or you do not have permission to edit it.");
          return;
        }
        const category =
          typeof post.category === "object"
            ? post.category?.name
            : post.category;
        setForm({
          ...INITIAL_FORM,
          title: post.title || "",
          excerpt: post.excerpt || "",
          content: post.content || post.body || "",
          category: category || "Technology",
          coverImage: post.coverImage || post.featuredImage || "",
          tags: Array.isArray(post.tags)
            ? post.tags
                .map((tag) => (typeof tag === "string" ? tag : tag.name))
                .filter(Boolean)
            : [],
          status: post.status || "draft",
        });
      } catch (err) {
        if (active)
          setError(
            err.response?.data?.message ||
              "Unable to load this post for editing.",
          );
      }
    };

    loadPost();
    return () => {
      active = false;
    };
  }, [editId, adminMode]);

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const addTag = (event) => {
    event.preventDefault();

    const tag = tagInput.trim().replace(/^#/, "");

    if (!tag) return;

    if (form.tags.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      setTagInput("");
      return;
    }

    if (form.tags.length >= 8) {
      setError("You can add a maximum of 8 tags.");
      return;
    }

    setForm((previous) => ({
      ...previous,
      tags: [...previous.tags, tag],
    }));

    setTagInput("");
    setError("");
  };

  const removeTag = (tagToRemove) => {
    setForm((previous) => ({
      ...previous,
      tags: previous.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (status) => {
    setError("");
    setSuccess("");

    if (form.title.trim().length < 3) {
      setError("Enter a title with at least 3 characters.");
      return;
    }

    if (!form.content.trim()) {
      setError("Write some content before saving or publishing.");
      return;
    }

    if (form.coverImage.trim()) {
      try {
        const url = new URL(form.coverImage.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid protocol");
        }
      } catch {
        setError("Please enter a valid cover image URL.");
        return;
      }
    }

    setLoadingAction(status);

    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        coverImage: form.coverImage.trim() || null,
        tags: form.tags,
        status,
      };

      const response = editId
        ? await api.put(
            adminMode ? `/admin/posts/${editId}` : `/posts/${editId}`,
            payload,
          )
        : await api.post("/posts", payload);

      const post =
        response.data?.data?.post ??
        response.data?.post ??
        response.data?.data ??
        response.data;
      const postId = post?.slug || post?._id || post?.id || editId;

      if (adminMode && editId) {
        navigate("/admin/posts", { replace: true });
      } else if (status === "published") {
        if (postId) {
          navigate(`/posts/${postId}`, { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else if (editId) {
        setSuccess("Your changes have been saved successfully.");
      } else {
        setSuccess("Your draft has been saved successfully.");
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Please sign in with an account that can create posts.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to save your story. Please try again.",
        );
      }
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              aria-label="Back to home"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </Link>

            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <BookOpen size={20} />
              </span>
              <span className="text-lg font-extrabold tracking-tight">
                Inkline<span className="text-indigo-600">.</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-400 sm:inline">
              {wordCount} words · {readingTime} min read
            </span>

            <button
              type="button"
              onClick={() =>
                setMode((previous) =>
                  previous === "editor" ? "preview" : "editor",
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Eye size={17} />
              <span className="hidden sm:inline">
                {mode === "editor" ? "Preview" : "Edit"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit("published")}
              disabled={Boolean(loadingAction)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-3 sm:px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingAction === "published" ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Publish
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="mb-8">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <PenLine size={16} />
            YOUR WRITING SPACE
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {mode === "editor"
              ? editId
                ? adminMode
                  ? "Edit any post"
                  : "Edit your story"
                : "Create a story"
              : "Preview your story"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Turn your ideas into something worth sharing.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <X size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {mode === "editor" ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Main editor */}
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <h2 className="font-bold">Story editor</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Make your next idea count.
                  </p>
                </div>

                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                  {wordCount} words
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Story title
                  </label>

                  <input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    maxLength={180}
                    placeholder="Give your story a compelling title..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-lg font-bold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 sm:text-xl"
                  />

                  <p className="mt-2 text-right text-xs text-slate-400">
                    {form.title.length}/180
                  </p>
                </div>
                {/* 
                <div>
                  <label
                    htmlFor="excerpt"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Short description
                  </label>

                  <textarea
                    id="excerpt"
                    name="excerpt"
                    value={form.excerpt}
                    onChange={updateField}
                    rows={3}
                    maxLength={300}
                    placeholder="What will readers discover in this story?"
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <p className="mt-2 text-right text-xs text-slate-400">
                    {form.excerpt.length}/300
                  </p>
                </div> */}

                <div>
                  <label
                    htmlFor="content"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Your story
                  </label>

                  <textarea
                    id="content"
                    name="content"
                    value={form.content}
                    onChange={updateField}
                    rows={20}
                    placeholder={`Start writing your story here...\n\nIntroduce your idea, explain your thinking, and give readers something useful to take away.`}
                    className="min-h-[420px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-4 text-base leading-8 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:px-6"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Estimated reading time: {readingTime} min
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-400">
                  Review your story before publishing.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleSubmit("draft")}
                    disabled={Boolean(loadingAction)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    {loadingAction === "draft" ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Save size={17} />
                    )}
                    Save draft
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("preview")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Preview story
                    <Eye size={17} />
                  </button>
                </div>
              </div>
            </section>

            {/* Publishing settings */}
            <aside className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-bold">Publishing settings</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Help readers discover your story.
                </p>

                <div className="mt-5">
                  <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Category
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="tagInput"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    <span className="flex items-center gap-2">
                      <Tag size={15} />
                      Tags
                    </span>
                  </label>

                  <form onSubmit={addTag} className="flex gap-2">
                    <input
                      id="tagInput"
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      placeholder="e.g. React"
                      maxLength={30}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    />

                    <button
                      type="submit"
                      className="rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Add
                    </button>
                  </form>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          aria-label={`Remove ${tag}`}
                          className="rounded-full hover:text-red-600"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Add up to 8 relevant tags.
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <ImagePlus size={19} className="text-indigo-600" />
                  <h2 className="font-bold">Cover image</h2>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Paste a public image URL to make your story stand out.
                </p>

                <label
                  htmlFor="coverImage"
                  className="mb-2 mt-4 block text-sm font-semibold text-slate-700"
                >
                  Image URL
                </label>

                <input
                  id="coverImage"
                  name="coverImage"
                  type="url"
                  value={form.coverImage}
                  onChange={updateField}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                />

                {form.coverImage && (
                  <div className="mt-4 overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={form.coverImage}
                      alt="Cover preview"
                      className="max-h-48 w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                      onLoad={(event) => {
                        event.currentTarget.style.display = "block";
                      }}
                    />
                  </div>
                )}
              </section>

              <section className="rounded-2xl bg-slate-950 p-5 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <BookOpen size={20} />
                </div>

                <h2 className="mt-4 font-bold">A little writing tip</h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Start with a clear idea, use short paragraphs, and finish with
                  something your readers can remember.
                </p>
              </section>
            </aside>
          </div>
        ) : (
          /* Preview */
          <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-10 sm:py-12">
            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
              {form.category}
            </span>

            <h2 className="mt-6 break-words text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {form.title || "Your story title"}
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-500">
              {form.excerpt || "Your story description will appear here."}
            </p>

            <div className="mt-6 flex items-center gap-3 border-b border-slate-100 pb-6 text-sm text-slate-500">
              <span>{wordCount} words</span>
              <span>·</span>
              <span>{readingTime} min read</span>
            </div>

            {form.coverImage && (
              <img
                src={form.coverImage}
                alt="Story cover"
                className="mt-8 max-h-[420px] w-full rounded-2xl object-cover"
              />
            )}

            <div className="mt-8 whitespace-pre-wrap break-words text-base leading-8 text-slate-700">
              {form.content ||
                "Your article content will appear here as you write."}
            </div>

            {form.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={() => setMode("editor")}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to editor
              </button>

              <button
                type="button"
                onClick={() => handleSubmit("draft")}
                disabled={Boolean(loadingAction)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <Save size={16} />
                Save draft
              </button>

              <button
                type="button"
                onClick={() => handleSubmit("published")}
                disabled={Boolean(loadingAction)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {loadingAction === "published" ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Publish story
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
