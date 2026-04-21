import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  LayoutDashboard,
  Wand2,
  FolderHeart,
  Package,
  Settings,
  CreditCard,
  Lightbulb,
  LogOut,
  Sun,
  Moon,
  Coins,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/studio", label: "استوديو الكتابة", icon: Wand2 },
  { to: "/templates", label: "قوالبي والمفضلة", icon: FolderHeart },
  { to: "/products", label: "ملفات المنتجات", icon: Package },
  { to: "/inspiration", label: "لوحة الإلهام", icon: Lightbulb },
  { to: "/billing", label: "الباقات والنقاط", icon: CreditCard },
  { to: "/settings", label: "الإعدادات", icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, signOut, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [balance, setBalance] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("points_balance").select("balance").eq("user_id", user.id).maybeSingle();
      setBalance(data?.balance ?? 0);
    };
    load();
    const ch = supabase
      .channel("points-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "points_balance", filter: `user_id=eq.${user.id}` }, (payload) => {
        const newBal = (payload.new as { balance?: number } | null)?.balance;
        if (typeof newBal === "number") setBalance(newBal);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-64 border-l bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">صياغة</span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 p-3">
          {NAV.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                location.pathname.startsWith("/admin")
                  ? "bg-gold/20 text-gold-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              لوحة الأدمن
            </Link>
          )}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-1 items-center justify-end gap-2">
            <Link to="/billing">
              <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm shadow-soft transition-colors hover:bg-accent">
                <Coins className="h-4 w-4 text-gold" />
                <span className="font-semibold">{balance ?? "..."}</span>
                <span className="text-muted-foreground">نقطة</span>
              </div>
            </Link>

            <Button variant="ghost" size="icon" onClick={toggle} aria-label="تبديل المظهر">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={signOut} aria-label="خروج">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>

      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
    </div>
  );
}
