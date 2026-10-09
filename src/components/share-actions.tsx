"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

/** Uses the Web Share API where available (native sheet on iOS/Android), else clipboard copy. */
export default function ShareActions({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function share() {
    try {
      await navigator.share({ title, url });
    } catch {
      /* The user dismissed the sheet. */
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-field)] border border-line-strong bg-white px-5 text-sm font-bold text-ink hover:bg-tint"
      >
        {copied ? <Check size={17} aria-hidden="true" className="text-brand" /> : <Copy size={17} aria-hidden="true" />}
        {copied ? "Link copied" : "Copy link"}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={share}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-field)] bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover"
        >
          <Share2 size={17} aria-hidden="true" /> Share
        </button>
      )}
    </div>
  );
}
