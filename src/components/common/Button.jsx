
const variants = {
  primary: "bg-ink text-white hover:bg-accent",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:border-accent hover:text-accent",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

export default function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl px-4 py-3 text-sm font-bold
        transition disabled:cursor-not-allowed
        disabled:opacity-60
        ${variants[variant]}
        ${className}
      `}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}