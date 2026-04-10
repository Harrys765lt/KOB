import { nicheColorMap } from "@/lib/constants";
import { Niche } from "@/lib/types";

export function NicheAccentBar({ niche }: { niche: Niche }) {
  return (
    <div
      className="h-1 w-full rounded-t-xl"
      style={{ backgroundColor: nicheColorMap[niche] }}
      aria-hidden
    />
  );
}
