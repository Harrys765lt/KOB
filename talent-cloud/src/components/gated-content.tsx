import { roleRank } from "@/lib/constants";
import { UserRole } from "@/lib/types";

type GatedContentProps = {
  requiredRole: UserRole;
  currentRole: UserRole;
  demoMode?: boolean;
  children: React.ReactNode;
  cta?: string;
};

export function GatedContent({
  requiredRole,
  currentRole,
  demoMode = false,
  children,
  cta = "Subscribe to unlock analytics.",
}: GatedContentProps) {
  if (demoMode || roleRank[currentRole] >= roleRank[requiredRole]) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-xs">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20 p-4">
        <div className="rounded-xl bg-white px-4 py-3 text-center shadow-lg">
          <p className="mb-1 text-sm font-semibold">Locked</p>
          <p className="text-xs text-[var(--text-secondary)]">{cta}</p>
        </div>
      </div>
    </div>
  );
}
