/**
 * Institutional logo slot. The official crest is never redrawn in code:
 * an administrator configures its URL in Admin → Institution and it is stored
 * in the database. Until then a neutral monogram plate is shown.
 */
export function Logo({ logoUrl, shortName, size = "md" }: { logoUrl: string | null; shortName: string; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-16 w-16 text-lg" : size === "sm" ? "h-9 w-9 text-[11px]" : "h-10 w-10 text-xs";

  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={`${shortName} logo`} className={`${box} shrink-0 rounded-[var(--radius-field)] object-contain`} />;
  }

  return (
    <span
      aria-hidden="true"
      className={`${box} flex shrink-0 items-center justify-center rounded-[var(--radius-field)] bg-brand font-extrabold tracking-tight text-white`}
    >
      {shortName.slice(0, 4).toUpperCase()}
    </span>
  );
}
