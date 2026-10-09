/**
 * Institutional logo slot. The official crest is never redrawn in code:
 * an administrator can configure its URL in Admin → Institution. The supplied
 * forum logo is used when no custom logo has been configured.
 */
export function Logo({ logoUrl, shortName, size = "md" }: { logoUrl: string | null; shortName: string; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-36 w-36" : size === "sm" ? "h-[81px] w-[81px]" : "h-[90px] w-[90px]";

  const source = !logoUrl || logoUrl === "/logo-placeholder.svg" ? "/logo.png" : logoUrl;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={source} alt={`${shortName} logo`} className={`${box} shrink-0 rounded-[var(--radius-field)] object-contain`} />;
}
