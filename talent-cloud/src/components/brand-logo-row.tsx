type BrandLogoRowProps = {
  brands: string[];
  selectedBrand?: string;
  onSelect: (brand: string) => void;
};

export function BrandLogoRow({ brands, selectedBrand, onSelect }: BrandLogoRowProps) {
  return (
    <div className="card-surface p-5">
      <p className="editorial-kicker">Logo Hero</p>
      <h2 className="mt-2 text-3xl font-bold">Names I Have Worked With</h2>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {brands.map((brand) => {
          const active = brand === selectedBrand;
          return (
            <button
              key={brand}
              onClick={() => onSelect(brand)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? "border-[var(--accent-blue)] bg-blue-50 text-blue-700 shadow-[0_8px_18px_rgba(59,130,246,0.2)]"
                  : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {brand}
            </button>
          );
        })}
      </div>
    </div>
  );
}
