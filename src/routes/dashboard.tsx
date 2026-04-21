import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Wand2,
  Search,
  Hash,
  MessageCircle,
  Languages,
  Calendar,
  Package,
  CheckCircle2,
  Coins,
  TrendingUp,
  FileText,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const TOOLS = [
  { to: "/studio", icon: Wand2, title: "استوديو الكتابة", desc: "ابدأ توليد محتوى مخصص", color: "from-primary to-primary/70" },
  { to: "/tools/url-analyzer", icon: Search, title: "تحليل رابط", desc: "حوّل رابط منتجك لمحتوى", cost: 18 },
  { to: "/tools/hooks", icon: Hash, title: "صانع خطافات", desc: "بدايات إعلانية جذابة", cost: 12 },
  { to: "/tools/smart-reply", icon: MessageCircle, title: "ردود ذكية", desc: "ردود لبقة على الاستفسارات", cost: 12 },
  { to: "/tools/dialect", icon: Languages, title: "محول اللهجات", desc: "غيّر لهجة النص", cost: 12 },
  { to: "/tools/weekly-plan", icon: Calendar, title: "خطة أسبوعية", desc: "خطة محتوى لأسبوع كامل", cost: 24 },
  { to: "/tools/offer-pack", icon: Package, title: "حزمة عرض", desc: "عرض تسويقي كامل", cost: 18 },
  { to: "/tools/proofread", icon: CheckCircle2, title: "تدقيق وتشكيل", desc: "تصحيح وتشكيل النصوص", cost: 3 },
];

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ balance: 0, totalSpent: 0, totalEarned: 0, contentCount: 0 });
  const [recent, setRecent] = useState<{ id: string; tool: string; output: string; created_at: string }[]>([]);
  const [profile, setProfile] = useState<{ display_name?: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [bal, content, prof] = await Promise.all([
        supabase.from("points_balance").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("generated_content").select("id, tool, output, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
      ]);
      setStats({
        balance: bal.data?.balance ?? 0,
        totalSpent: bal.data?.total_spent ?? 0,
        totalEarned: bal.data?.total_earned ?? 0,
        contentCount: content.data?.length ?? 0,
      });
      setRecent(content.data ?? []);
      setProfile(prof.data);
    };
    load();
  }, [user]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold">
            مرحباً، {profile?.display_name ?? "صديقنا"} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">جاهز تصنع محتوى تسويقي يبيع؟</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Coins} label="الرصيد الحالي" value={stats.balance} suffix="نقطة" highlight />
          <StatCard icon={TrendingUp} label="إجمالي المستهلك" value={stats.totalSpent} suffix="نقطة" />
          <StatCard icon={Sparkles} label="إجمالي المكتسب" value={stats.totalEarned} suffix="نقطة" />
          <StatCard icon={FileText} label="آخر المخرجات" value={stats.contentCount} suffix="نص" />
        </div>

        {/* Quick tools */}
        <div>
          <h2 className="mb-4 text-xl font-bold">الأدوات السريعة</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <t.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold">{t.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                {t.cost && (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    <Coins className="h-3 w-3 text-gold" />
                    {t.cost} نقطة
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">آخر المخرجات</h2>
            <Link to="/templates" className="text-sm text-primary hover:underline">
              عرض الكل
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">لا توجد مخرجات بعد. ابدأ من الاستوديو!</p>
              <Link to="/studio" className="mt-4 inline-block">
                <span className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  افتح الاستوديو
                </span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((c) => (
                <div key={c.id} className="rounded-xl border bg-card p-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">{c.tool}</span>
                    <span>{new Date(c.created_at).toLocaleString("ar-SA")}</span>
                  </div>
                  <p className="line-clamp-2 text-sm">{c.output}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  highlight,
}: {
  icon: typeof Coins;
  label: string;
  value: number;
  suffix: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-soft ${highlight ? "gradient-primary text-primary-foreground" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm ${highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</span>
        <Icon className={`h-5 w-5 ${highlight ? "text-gold" : "text-muted-foreground"}`} />
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold">{value}</span>
        <span className={`text-xs ${highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{suffix}</span>
      </div>
    </div>
  );
}
