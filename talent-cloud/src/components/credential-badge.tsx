export function CredentialBadge({ credentialNumber }: { credentialNumber: string }) {
  return (
    <p className="credential-font inline-flex rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm tracking-[0.16em] text-slate-900 shadow-[var(--shadow-soft)]">
      {credentialNumber}
    </p>
  );
}
