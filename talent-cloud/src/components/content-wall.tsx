export function ContentWall() {
  return (
    <section className="card-surface relative overflow-hidden p-5">
      <h2 className="mb-4 text-3xl font-bold">My Content</h2>
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1 grid gap-3">
          <div className="h-24 rounded-md bg-slate-200 p-2 text-xs text-slate-600">content here</div>
          <div className="h-24 rounded-md bg-slate-200 p-2 text-xs text-slate-600">content here</div>
        </div>
        <div className="col-span-2 h-52 rounded-md bg-gradient-to-br from-slate-300 to-slate-200 p-2 text-xs text-slate-700">
          hero content
        </div>
        <div className="col-span-1 grid gap-3">
          <div className="h-24 rounded-md bg-slate-200 p-2 text-xs text-slate-600">content here</div>
          <div className="h-24 rounded-md bg-slate-200 p-2 text-xs text-slate-600">content here</div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
    </section>
  );
}
