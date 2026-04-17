type BrandLogoRowProps = {
  brands: string[];
  selectedBrand?: string;
  onSelect: (brand: string) => void;
};

export function BrandLogoRow({ brands, selectedBrand, onSelect }: BrandLogoRowProps) {
  return (
    <div className="card-surface p-5">
      <p className="editorial-kicker">Past Experience</p>
      <h2 className="mt-2 text-3xl font-bold">Names I Have Worked With</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Select a brand to reveal content highlights.</p>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {brands.map((brand) => {
          const active = brand === selectedBrand;
          return (
            <button
              key={brand}
              onClick={() => onSelect(brand)}
              className={`min-w-[120px] rounded-md border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
                active
                  ? "border-[var(--accent-blue)] bg-[#e8f2ec] text-[#1e6047] shadow-[0_8px_18px_rgba(47,127,95,0.2)]"
                  : "border-[var(--border)] bg-white text-[#5f7166] hover:border-[#bfd1c4] hover:text-[var(--text-primary)]"
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
