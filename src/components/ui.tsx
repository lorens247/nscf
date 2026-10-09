import type { ReactNode } from "react";

export function RepresentativeAvatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  if (!imageUrl) return <Initials name={name} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imageUrl} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover" />;
}

export function Initials({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
  const box = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return (
    <span
      aria-hidden="true"
      className={`flex ${box} shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white`}
    >
      {initials || "—"}
    </span>
  );
}

export function EmptyState({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <div className="mt-4 rounded-[var(--radius-card)] border border-dashed border-line-strong bg-white p-8 text-center">
      <p className="text-sm text-muted">{text}</p>
      {children && <div className="mt-4 flex justify-center">{children}</div>}
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand">{eyebrow}</p>}
        <h1 className="mt-1.5 text-2xl font-bold text-ink md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Notice({ tone, children }: { tone: "success" | "error" | "info"; children: ReactNode }) {
  const styles = {
    success: "border-brand-line bg-brand-soft text-brand-ink",
    error: "border-accent/25 bg-accent-soft text-accent",
    info: "border-line bg-white text-muted",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-[var(--radius-field)] border px-4 py-3 text-sm font-medium ${styles}`}>
      {children}
    </div>
  );
}

/** 44px minimum control height on touch devices. */
export const inputClass =
  "mt-1.5 block min-h-11 w-full rounded-[var(--radius-field)] border border-line-strong bg-white px-3.5 text-base text-ink shadow-[inset_0_1px_0_rgba(16,32,26,0.03)] placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:text-sm aria-[invalid=true]:border-accent";

export const buttonPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-field)] bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover active:bg-brand-ink disabled:cursor-not-allowed disabled:opacity-55";

export const buttonSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-field)] border border-line-strong bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-tint active:bg-brand-soft disabled:opacity-55";

export const buttonGhost =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-field)] px-4 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft";

export const buttonDanger =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-field)] border border-accent/30 bg-white px-5 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-45";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[var(--radius-card)] border border-line bg-white shadow-[0_1px_2px_rgba(16,32,26,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-base font-bold text-ink sm:text-lg">{title}</h2>
      {action}
    </div>
  );
}

/** Horizontally scrollable chip row with snap points. The mobile-first way to expose facets. */
export function ChipRow({ children, labelledBy }: { children: ReactNode; labelledBy?: string }) {
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
    >
      {children}
    </div>
  );
}

export function Chip({
  href,
  active,
  children,
  count,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
  count?: number;
}) {
  return (
    <a
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
        active
          ? "border-brand bg-brand text-white"
          : "border-line-strong bg-white text-ink hover:border-brand hover:bg-brand-soft hover:text-brand"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-white/20 text-white" : "bg-tint text-muted"}`}>{count}</span>
      )}
    </a>
  );
}
