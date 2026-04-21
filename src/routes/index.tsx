import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Wand2,
  Languages,
  ShieldCheck,
  Zap,
  FileText,
  MessageCircle,
  Hash,
  Calendar,
  Package,
  Heart,
  Search,
  Lightbulb,
  Target,
  CheckCircle2,
  Sun,
  Moon,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const FEATURES = [
  { icon: Search, title: "تحليل الروابط", desc: "أدخل رابط منتجك ونحوّله لمحتوى تسويقي جاهز" },
  { icon: Wand2, title: "المحول السحري", desc: "حوّل أي نص لصيغة جديدة تناسب منصتك" },
  { icon: Hash, title: "صانع الخطافات", desc: "بدايات إعلانية جذابة تشدّ الانتباه" },
  { icon: MessageCircle, title: "الردود الذكية", desc: "ردود لبقة على استفسارات العملاء" },
  { icon: CheckCircle2, title: "تدقيق وتشكيل", desc: "تصحيح إملائي ولغوي مع تشكيل دقيق" },
  { icon: Languages, title: "تعدد اللهجات", desc: "فصحى، بيضاء، نجدي، حجازي، إماراتي" },
  { icon: Heart, title: "نبرة العلامة", desc: "احفظ نبرتك واستخدمها في كل المحتوى" },
  { icon: ShieldCheck, title: "قفل المصطلحات", desc: "حماية أسماء منتجاتك من التغيير" },
  { icon: FileText, title: "مكتبة القوالب", desc: "قوالب جاهزة وقوالب خاصة بك" },
  { icon: Zap, title: "نسخ متعددة A/B", desc: "أكثر من نسخة لاختيار الأفضل" },
  { icon: Target, title: "صانع الـ CTA", desc: "دعوات اتخاذ إجراء مقنعة" },
  { icon: Package, title: "حزم العروض", desc: "عرض تسويقي كامل في خطوة واحدة" },
  { icon: Calendar, title: "الخطة الأسبوعية", desc: "خطة محتوى لأسبوع كامل" },
  { icon: Package, title: "ملفات المنتجات", desc: "احفظ بيانات منتجاتك للوصول السريع" },
  { icon: Lightbulb, title: "محفزات نفسية", desc: "ندرة، استعجال، دليل اجتماعي" },
  { icon: Search, title: "SEO محلي", desc: "كلمات مفتاحية للسوق المحلي" },
  { icon: Lightbulb, title: "لوحة الإلهام", desc: "نماذج وأمثلة لإلهامك" },
  { icon: Zap, title: "اختصار سريع", desc: "اختصر النصوص الطويلة بثوانٍ" },
  { icon: Wand2, title: "إعادة صياغة", desc: "صياغة جديدة بنفس المعنى" },
];

const PLANS = [
  { name: "الأساسية", price: 49, points: 350, target: "للمستخدم الفردي", features: ["350 نقطة شهرياً", "كل العمليات الخفيفة", "أغلب أدوات Pro", "حفظ القوالب والمنتجات"] },
  { name: "المحترفين", price: 89, points: 900, popular: true, target: "للتاجر النشط", features: ["900 نقطة شهرياً", "كل أدوات Pro", "تحليل روابط متقدم", "الخطة الأسبوعية", "أولوية الدعم"] },
  { name: "الأعمال", price: 199, points: 2400, target: "لإدارة متجر كامل", features: ["2400 نقطة شهرياً", "وصول كامل لكل الميزات", "حزم العروض غير محدودة", "بطاقات منتجات لا محدودة", "دعم مخصص"] },
];

function Landing() {
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">صياغة</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle}>
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Link to="/auth">
              <Button variant="ghost">تسجيل الدخول</Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button>ابدأ مجاناً</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 gradient-soft" />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm shadow-soft">
            <Sparkles className="h-4 w-4 text-gold" />
            <span>مدعوم بأحدث تقنيات الذكاء الاصطناعي</span>
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
            محتوى تسويقي يبيع،
            <br />
            <span className="bg-gradient-to-l from-primary to-gold bg-clip-text text-transparent">
              بلهجتك ولجمهورك
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            منصة ذكية تحوّل روابط منتجاتك وأفكارك إلى نصوص تسويقية احترافية باللهجات السعودية والخليجية،
            في ثوانٍ معدودة.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" className="h-12 gap-2 px-8 text-base shadow-glow">
                ابدأ مجاناً — 50 نقطة هدية
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                شاهد المميزات
              </Button>
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">بدون بطاقة ائتمانية • تسجيل في أقل من دقيقة</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">19 أداة قوية في منصة واحدة</h2>
          <p className="mt-3 text-muted-foreground">كل ما تحتاجه لصناعة محتوى تسويقي يحوّل المتصفحين لعملاء</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="group rounded-2xl border bg-card p-5 shadow-soft transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">باقات تناسب كل احتياج</h2>
            <p className="mt-3 text-muted-foreground">اختر الباقة المناسبة لك وارتقِ بمحتواك</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-3xl border bg-card p-8 shadow-soft transition-all ${
                  p.popular ? "border-primary shadow-glow lg:scale-105" : "hover:shadow-md"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 right-1/2 translate-x-1/2 rounded-full gradient-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                    الأكثر طلباً
                  </div>
                )}
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.target}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl font-black">{p.price}</span>
                  <span className="text-muted-foreground">ريال/شهر</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-gold">{p.points} نقطة</div>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth" search={{ mode: "signup" }} className="mt-8 block">
                  <Button className="w-full" variant={p.popular ? "default" : "outline"}>
                    اختر هذه الباقة
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center lg:px-8">
        <h2 className="text-3xl font-bold md:text-4xl">جاهز تبدأ؟</h2>
        <p className="mt-3 text-muted-foreground">سجّل الآن واحصل على 50 نقطة مجانية لتجربة المنصة</p>
        <Link to="/auth" search={{ mode: "signup" }} className="mt-8 inline-block">
          <Button size="lg" className="h-12 gap-2 px-8 shadow-glow">
            إنشاء حساب مجاني
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground lg:px-8">
          © {new Date().getFullYear()} صياغة — جميع الحقوق محفوظة
        </div>
      </footer>
    </div>
  );
}
