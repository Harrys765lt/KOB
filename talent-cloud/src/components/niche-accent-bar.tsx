import { Niche } from "@/lib/types";

export function NicheAccentBar({ niche: _niche }: { niche: Niche }) {
  return (
    <div
      className="h-1 w-full rounded-t-xl"
      data-niche={_niche}
      style={{ backgroundColor: "var(--accent-blue)" }}
      aria-hidden
    />
  );
}
