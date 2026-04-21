import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Search, Hash, MessageCircle, Languages, Calendar, Package, CheckCircle2, Wand2, Target, Zap, Repeat, Globe, Coins } from "lucide-react";

export const Route = createFileRoute("/tools/")({
  component: ToolsIndex,
});

const ALL_TOOLS = [
  { to: "/tools/url-analyzer", icon: Search, title: "تحليل الروابط", desc: "حوّل رابط منتج لمحتوى", cost: "18-24" },
  { to: "/tools/hooks", icon: Hash, title: "صانع الخطافات", desc: "5 بدايات إعلانية جذابة", cost: 12 },
  { to: "/tools/smart-reply", icon: MessageCircle, title: "الردود الذكية", desc: "ردود لبقة للعملاء", cost: 12 },
  { to: "/tools/dialect", icon: Languages, title: "محول اللهجات", desc: "غيّر لهجة النص", cost: 12 },
  { to: "/tools/cta", icon: Target, title: "صانع CTA", desc: "دعوات اتخاذ إجراء", cost: 12 },
  { to: "/tools/ab-variants", icon: Zap, title: "نسخ A/B/C", desc: "نسخ متعددة لاختبار الأفضل", cost: 12 },
  { to: "/tools/seo", icon: Globe, title: "SEO محلي", desc: "محتوى محسّن للبحث المحلي", cost: 12 },
  { to: "/tools/transformer", icon: Wand2, title: "المحول السحري", desc: "حوّل النص لصيغة جديدة", cost: 12 },
  { to: "/tools/offer-pack", icon: Package, title: "حزمة عرض كاملة", desc: "عرض تسويقي شامل", cost: 18 },
  { to: "/tools/weekly-plan", icon: Calendar, title: "خطة أسبوعية", desc: "محتوى أسبوع كامل", cost: 24 },
  { to: "/tools/proofread", icon: CheckCircle2, title: "تدقيق وتشكيل", desc: "تصحيح وتشكيل النصوص", cost: 3 },
  { to: "/tools/shortener", icon: Zap, title: "اختصار سريع", desc: "اختصر النصوص الطويلة", cost: 3 },
  { to: "/tools/rewrite", icon: Repeat, title: "إعادة صياغة", desc: "صياغة جديدة محسّنة", cost: 5 },
];

function ToolsIndex() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold">جميع الأدوات</h1>
        <p className="mt-1 text-muted-foreground">اختر الأداة المناسبة لمهمتك</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ALL_TOOLS.map((t) => (
            <Link key={t.to} to={t.to} className="group rounded-2xl border bg-card p-5 shadow-soft transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <t.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                <Coins className="h-3 w-3 text-gold" />
                {t.cost} نقطة
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
