"use client";

type TalentSectionTemplate = {
  id: string;
  name: string;
  description: string;
};

export type TalentSectionId = "brand-experience" | "content-highlight" | "content-wall";

export type TalentSectionTemplateSelection = Partial<Record<TalentSectionId, string>>;

export const TALENT_SECTION_TEMPLATE_REGISTRY: Record<TalentSectionId, TalentSectionTemplate[]> = {
  "brand-experience": [
    {
      id: "motion-carousel",
      name: "Motion Carousel",
      description: "Wide moving brand rail with selected brand cards.",
    },
    {
      id: "compact-rail",
      name: "Compact Rail",
      description: "Tighter brand rail for denser talent cards.",
    },
  ],
  "content-highlight": [
    {
      id: "split-metrics",
      name: "Split Metrics",
      description: "Brand story, campaign metadata, deliverable mix, and media rail.",
    },
    {
      id: "gallery-focus",
      name: "Gallery Focus",
      description: "A wider media stage with the supporting windows pulled forward.",
    },
  ],
  "content-wall": [
    {
      id: "feature-stack",
      name: "Feature Stack",
      description: "One hero feature with supporting content windows.",
    },
    {
      id: "collection-grid",
      name: "Collection Grid",
      description: "More compact wall layout with equal content emphasis.",
    },
  ],
};

export const DEFAULT_TALENT_SECTION_TEMPLATES: Record<TalentSectionId, string> = {
  "brand-experience": "motion-carousel",
  "content-highlight": "split-metrics",
  "content-wall": "feature-stack",
};

export function resolveTalentSectionTemplates(
  templates?: TalentSectionTemplateSelection,
): Record<TalentSectionId, string> {
  return (Object.keys(TALENT_SECTION_TEMPLATE_REGISTRY) as TalentSectionId[]).reduce(
    (resolved, sectionId) => {
      const requestedTemplateId = templates?.[sectionId];
      const isKnownTemplate = TALENT_SECTION_TEMPLATE_REGISTRY[sectionId].some(
        (template) => template.id === requestedTemplateId,
      );

      resolved[sectionId] = isKnownTemplate
        ? requestedTemplateId!
        : DEFAULT_TALENT_SECTION_TEMPLATES[sectionId];

      return resolved;
    },
    {} as Record<TalentSectionId, string>,
  );
}

export function SectionTemplatePicker({
  sectionId,
  selectedTemplateId,
  onTemplateChange,
}: {
  sectionId: TalentSectionId;
  selectedTemplateId: string;
  onTemplateChange: (sectionId: TalentSectionId, templateId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-[#d9e4db] bg-white p-3 shadow-[0_10px_26px_rgba(16,33,24,0.06)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#174d38]">Template</p>
        <span className="rounded-full border border-[#c9a84c]/50 bg-[#fbf6e6] px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#6f5d22]">
          Library
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {TALENT_SECTION_TEMPLATE_REGISTRY[sectionId].map((template) => {
          const active = template.id === selectedTemplateId;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onTemplateChange(sectionId, template.id)}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                active
                  ? "border-[#174d38] bg-[#f1f7f3] shadow-[0_8px_18px_rgba(23,77,56,0.1)]"
                  : "border-[var(--border)] bg-[#fbfcfb] hover:border-[#b9d3bf]"
              }`}
            >
              <span className="block text-sm font-semibold text-[#102018]">{template.name}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">
                {template.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
