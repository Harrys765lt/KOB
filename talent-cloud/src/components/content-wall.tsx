export function ContentWall() {
  return (
    <section className="card-surface p-5">
      <h2 className="mb-4 text-center text-3xl font-bold">Content Wall</h2>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="grid gap-3 md:col-span-1">
          <div className="h-24 rounded-md border border-[var(--border)] bg-[#eef4ef] p-2 text-xs text-[#5f7166]">
            content here
          </div>
          <div className="h-24 rounded-md border border-[var(--border)] bg-[#eef4ef] p-2 text-xs text-[#5f7166]">
            content here
          </div>
        </div>
        <div className="h-52 rounded-md border border-[var(--border)] bg-gradient-to-br from-[#d3dfd7] to-[#eef4ef] p-2 text-xs text-[#425348] md:col-span-2">
          hero content
        </div>
        <div className="grid gap-3 md:col-span-1">
          <div className="h-24 rounded-md border border-[var(--border)] bg-[#eef4ef] p-2 text-xs text-[#5f7166]">
            content here
          </div>
          <div className="h-24 rounded-md border border-[var(--border)] bg-[#eef4ef] p-2 text-xs text-[#5f7166]">
            content here
          </div>
        </div>
      </div>
    </section>
  );
}
