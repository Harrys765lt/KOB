export type BrandCatalogEntry = {
  name: string;
  logoPath: string;
  monogram: string;
  category: string;
  accent: string;
  surface: string;
  badge: string;
  ink: string;
  aliases?: string[];
};

export const BRAND_CATALOG: BrandCatalogEntry[] = [
  {
    name: "Crocs",
    logoPath: "/brands/crocs.png",
    monogram: "CR",
    category: "Footwear",
    accent: "#6c8d2b",
    surface: "linear-gradient(135deg, #f7fbdd 0%, #eaf4b7 100%)",
    badge: "linear-gradient(135deg, #7ea03e 0%, #b8d76a 100%)",
    ink: "#213013",
  },
  {
    name: "G-Shock",
    logoPath: "/brands/g-shock.png",
    monogram: "GS",
    category: "Watchwear",
    accent: "#2f3338",
    surface: "linear-gradient(135deg, #eef1f4 0%, #d7dde5 100%)",
    badge: "linear-gradient(135deg, #171a1f 0%, #4c5562 100%)",
    ink: "#eef2f7",
    aliases: ["G Shock", "GSHOCK"],
  },
  {
    name: "Rare Beauty",
    logoPath: "/brands/rare-beauty.png",
    monogram: "RB",
    category: "Beauty",
    accent: "#b16a78",
    surface: "linear-gradient(135deg, #fff1f4 0%, #f6d8df 100%)",
    badge: "linear-gradient(135deg, #c27a89 0%, #edb6c0 100%)",
    ink: "#4b2430",
  },
  {
    name: "Uniqlo",
    logoPath: "/brands/uniqlo.png",
    monogram: "UQ",
    category: "Fashion",
    accent: "#b81f2d",
    surface: "linear-gradient(135deg, #fff0f0 0%, #ffd9dd 100%)",
    badge: "linear-gradient(135deg, #c31d2d 0%, #ef4759 100%)",
    ink: "#fff6f7",
  },
  {
    name: "GSC Movies",
    logoPath: "/brands/gsc.png",
    monogram: "GS",
    category: "Entertainment",
    accent: "#7a5a1d",
    surface: "linear-gradient(135deg, #fff7e5 0%, #f3e0ab 100%)",
    badge: "linear-gradient(135deg, #8c651d 0%, #d3a54b 100%)",
    ink: "#39240d",
    aliases: ["GSC"],
  },
  {
    name: "Sephora",
    logoPath: "/brands/sephora.png",
    monogram: "SP",
    category: "Beauty",
    accent: "#262626",
    surface: "linear-gradient(135deg, #faf7f7 0%, #ece6e7 100%)",
    badge: "linear-gradient(135deg, #101010 0%, #474747 100%)",
    ink: "#f5f5f5",
  },
  {
    name: "Nike",
    logoPath: "/brands/nike.png",
    monogram: "NK",
    category: "Sportswear",
    accent: "#1f1f1f",
    surface: "linear-gradient(135deg, #f8f8f8 0%, #e6e6e6 100%)",
    badge: "linear-gradient(135deg, #141414 0%, #4f4f4f 100%)",
    ink: "#f9fafb",
  },
  {
    name: "Adidas",
    logoPath: "/brands/adidas.png",
    monogram: "AD",
    category: "Sportswear",
    accent: "#194053",
    surface: "linear-gradient(135deg, #eff8fb 0%, #d6edf4 100%)",
    badge: "linear-gradient(135deg, #123547 0%, #3a7386 100%)",
    ink: "#eef9fd",
  },
  {
    name: "JD Sports",
    logoPath: "/brands/jd-sports.png",
    monogram: "JD",
    category: "Retail",
    accent: "#1d1d1d",
    surface: "linear-gradient(135deg, #f6f6f6 0%, #e7e7e7 100%)",
    badge: "linear-gradient(135deg, #111111 0%, #444444 100%)",
    ink: "#f8f8f8",
    aliases: ["JD"],
  },
  {
    name: "Puma",
    logoPath: "/brands/puma.png",
    monogram: "PM",
    category: "Sportswear",
    accent: "#161616",
    surface: "linear-gradient(135deg, #f7f7f7 0%, #ececec 100%)",
    badge: "linear-gradient(135deg, #0f0f0f 0%, #4a4a4a 100%)",
    ink: "#f7f7f7",
  },
  {
    name: "Samsung",
    logoPath: "/brands/samsung.png",
    monogram: "SG",
    category: "Tech",
    accent: "#214fbd",
    surface: "linear-gradient(135deg, #edf4ff 0%, #d9e6ff 100%)",
    badge: "linear-gradient(135deg, #234fb2 0%, #4e86ff 100%)",
    ink: "#eef4ff",
  },
  {
    name: "Grab",
    logoPath: "/brands/grab.png",
    monogram: "GB",
    category: "Platform",
    accent: "#1e7d46",
    surface: "linear-gradient(135deg, #effcf3 0%, #d4f1dd 100%)",
    badge: "linear-gradient(135deg, #1f7f47 0%, #43b56e 100%)",
    ink: "#edfdf2",
  },
  {
    name: "AirAsia",
    logoPath: "/brands/airasia.png",
    monogram: "AA",
    category: "Travel",
    accent: "#bd2432",
    surface: "linear-gradient(135deg, #fff1f0 0%, #ffdadd 100%)",
    badge: "linear-gradient(135deg, #c22231 0%, #f45c69 100%)",
    ink: "#fff7f7",
  },
  {
    name: "Zalora",
    logoPath: "/brands/zalora.png",
    monogram: "ZA",
    category: "Fashion",
    accent: "#7649b8",
    surface: "linear-gradient(135deg, #f5efff 0%, #e4d7ff 100%)",
    badge: "linear-gradient(135deg, #7a48bd 0%, #ab7df0 100%)",
    ink: "#faf6ff",
  },
];

export function normalizeBrandName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function getBrandCatalogEntry(brandName: string) {
  const normalized = normalizeBrandName(brandName);

  return BRAND_CATALOG.find((entry) => {
    if (normalizeBrandName(entry.name) === normalized) {
      return true;
    }

    return entry.aliases?.some((alias) => normalizeBrandName(alias) === normalized);
  });
}
