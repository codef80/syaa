/**
 * Tool catalog — single source of truth for AI tool costs and metadata.
 */
export type ToolKey =
  | "url_analyzer_short"
  | "url_analyzer_pro"
  | "magic_transformer"
  | "hook_generator"
  | "smart_reply"
  | "dialect_switcher"
  | "cta_generator"
  | "ab_variants"
  | "seo_local"
  | "offer_pack"
  | "weekly_plan"
  | "proofread"
  | "shortener"
  | "rewrite_light"
  | "studio_generate";

export const TOOL_COSTS: Record<ToolKey, number> = {
  url_analyzer_short: 18,
  url_analyzer_pro: 24,
  magic_transformer: 12,
  hook_generator: 12,
  smart_reply: 12,
  dialect_switcher: 12,
  cta_generator: 12,
  ab_variants: 12,
  seo_local: 12,
  offer_pack: 18,
  weekly_plan: 24,
  proofread: 3,
  shortener: 3,
  rewrite_light: 5,
  studio_generate: 12,
};

export const TOOL_MODELS: Record<ToolKey, "flash" | "pro"> = {
  url_analyzer_short: "pro",
  url_analyzer_pro: "pro",
  magic_transformer: "pro",
  hook_generator: "pro",
  smart_reply: "pro",
  dialect_switcher: "pro",
  cta_generator: "pro",
  ab_variants: "pro",
  seo_local: "pro",
  offer_pack: "pro",
  weekly_plan: "pro",
  proofread: "flash",
  shortener: "flash",
  rewrite_light: "flash",
  studio_generate: "pro",
};

export const TOOL_LABELS: Record<ToolKey, string> = {
  url_analyzer_short: "تحليل رابط مختصر",
  url_analyzer_pro: "تحليل رابط احترافي",
  magic_transformer: "المحول السحري",
  hook_generator: "صانع الخطافات",
  smart_reply: "الرد الذكي",
  dialect_switcher: "محول اللهجات",
  cta_generator: "صانع CTA",
  ab_variants: "نسخ A/B",
  seo_local: "SEO محلي",
  offer_pack: "حزمة عرض",
  weekly_plan: "خطة أسبوعية",
  proofread: "تدقيق وتشكيل",
  shortener: "اختصار النص",
  rewrite_light: "إعادة صياغة خفيفة",
  studio_generate: "توليد من الاستوديو",
};

export const PLAN_DETAILS = {
  basic: { name: "الأساسية", price: 49, points: 350 },
  pro: { name: "المحترفين", price: 89, points: 900 },
  business: { name: "الأعمال", price: 199, points: 2400 },
} as const;

export const DIALECTS = ["فصحى", "بيضاء", "نجدي", "حجازي", "إماراتي"] as const;
export const TONES = ["فاخر", "شعبي", "رسمي", "شبابي", "خيري"] as const;
export const PLATFORMS = ["تويتر / X", "إنستقرام", "تيك توك", "سناب شات", "واتساب", "متجر إلكتروني", "إعلان مدفوع"] as const;
export const TEXT_TYPES = [
  "إعلان قصير",
  "منشور سوشيال",
  "رسالة واتساب",
  "تغريدة",
  "وصف منتج",
  "كابشن",
  "قصة قصيرة",
  "إيميل تسويقي",
] as const;
export const PSYCH_TRIGGERS = ["ندرة", "استعجال", "دليل اجتماعي", "حصرية", "خصم"] as const;
