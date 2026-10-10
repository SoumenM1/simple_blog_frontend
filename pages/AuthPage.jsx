import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { api } from "../src/services/api";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, loading: authLoading } = useAuth();

  // The URL determines whether Login or Register is displayed.
  const mode = location.pathname === "/register" ? "register" : "login";
  const isRegister = mode === "register";

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError("");
    setShowPassword(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate("/", { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (isRegister && !form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      } else {
        await login({ email: form.email.trim(), password: form.password });
      }
      const destination = location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSSO = (provider) => {
    // Your backend should implement the OAuth flow.
    const baseURL = api.defaults.baseURL?.replace(/\/$/, "") || "";
    window.location.href = `${baseURL}/auth/${provider}`;
  };

  const switchMode = (nextMode) => {
    setError("");
    setShowPassword(false);
    navigate(nextMode === "register" ? "/register" : "/login");
  };

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        {/* Left: Brand panel */}
        <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex xl:p-16">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />

          <Link to="/" className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
              <BookOpen size={23} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Inkline<span className="text-indigo-400">.</span>
            </span>
          </Link>

          <div className="relative z-10 max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Your next chapter starts here
            </div>

            <h1 className="text-5xl font-semibold leading-[1.15] tracking-tight xl:text-6xl">
              Ideas worth
              <br />
              sharing. Stories
              <br />
              <span className="text-indigo-400">worth reading.</span>
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-slate-400">
              A thoughtful space for writers, curious minds, and people who
              believe every great idea deserves an audience.
            </p>

            <div className="mt-10 space-y-5">
              {[
                "Publish your stories and ideas",
                "Connect with a community of readers",
                "Build your personal writing portfolio",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                    <Check size={15} />
                  </span>
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-sm text-slate-500">
            <span>© {new Date().getFullYear()} Inkline</span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} />
              Your privacy matters
            </span>
          </div>
        </aside>

        {/* Right: Authentication form */}
        <section className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-1/2 lg:px-12">
          <div className="w-full max-w-[440px]">
            {/* Mobile brand */}
            <Link
              to="/"
              className="mb-10 flex items-center justify-center gap-3 lg:hidden"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <BookOpen size={21} />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Inkline<span className="text-indigo-600">.</span>
              </span>
            </Link>

            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
                Welcome to Inkline
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {isRegister ? "Create your account" : "Welcome back"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                {isRegister
                  ? "Join the community and start sharing your stories."
                  : "Sign in to continue your reading and writing journey."}
              </p>
            </div>

            {/* Login / Register switch */}
            <div className="mb-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  !isRegister
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  isRegister
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Create account
              </button>
            </div>

            {/* SSO buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSSO("google")}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.09-1.92 3.27-4.74 3.27-8.1Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.28-1.93-6.15-4.53H2.16v2.84A11 11 0 0 0 12 23Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.16a11 11 0 0 0 0 9.9l3.69-2.84Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.36c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0a11 11 0 0 0-9.84 7.05l3.69 2.84C6.72 7.29 9.14 4.36 12 4.36Z"
                  />
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={() => handleSSO("facebook")}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    fill="#1877F2"
                    d="M24 12a12 12 0 1 0-13.875 11.85v-8.38H7.08V12h3.045V9.35c0-3.005 1.79-4.665 4.53-4.665 1.31 0 2.68.235 2.68.235v2.945h-1.51c-1.49 0-1.955.925-1.955 1.875V12h3.325l-.53 3.47h-2.795v8.38A12 12 0 0 0 24 12Z"
                  />
                  <path
                    fill="#fff"
                    d="M16.67 15.47 17.2 12h-3.325V9.74c0-.95.465-1.875 1.955-1.875h1.51V4.92s-1.37-.235-2.68-.235c-2.74 0-4.53 1.66-4.53 4.665V12H7.08v3.47h3.045v8.38a12.1 12.1 0 0 0 3.75 0v-8.38h2.795Z"
                  />
                </svg>
                Facebook
              </button>
            </div>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                or continue with email
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full name
                  </label>
                  <div className="relative">
                    <UserRound
                      size={19}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={updateField}
                      required={isRegister}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={updateField}
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  {!isRegister && (
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    placeholder={
                      isRegister
                        ? "At least 8 characters"
                        : "Enter your password"
                    }
                    value={form.password}
                    onChange={updateField}
                    minLength={8}
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-indigo-600/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={19} className="animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {isRegister ? "Create account" : "Sign in"}
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-5 text-slate-500">
                By continuing, you agree to our{" "}
                <Link
                  to="/terms"
                  className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-indigo-600"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-indigo-600"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              {isRegister ? "Already have an account?" : "New to Inkline?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(isRegister ? "login" : "register")}
                className="font-bold text-indigo-600 hover:text-indigo-700"
              >
                {isRegister ? "Sign in" : "Create an account"}
              </button>
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} />
              Secure authentication
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
