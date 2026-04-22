import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("بريد إلكتروني غير صحيح").max(255);
const passwordSchema = z.string().min(6, "كلمة المرور يجب 6 أحرف على الأقل").max(100);
const nameSchema = z.string().trim().min(2, "الاسم قصير جداً").max(50);

function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard" });
  }, [user, authLoading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (mode === "signup") nameSchema.parse(name);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0].message);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب! حصلت على 50 نقطة مجانية 🎉");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("أهلاً بك من جديد!");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حدث خطأ";
      if (msg.includes("Invalid login")) toast.error("البريد أو كلمة المرور غير صحيحة");
      else if (msg.includes("already registered") || msg.includes("already been registered")) toast.error("هذا البريد مسجل مسبقاً");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    try {
      emailSchema.parse(email);
    } catch {
      toast.error("اكتب بريدك أولاً ثم اضغط استعادة كلمة المرور");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=login`,
      });
      if (error) throw error;
      toast.success("تم إرسال رابط استعادة كلمة المرور إلى بريدك");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر إرسال رابط الاستعادة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 -z-10 gradient-soft" />
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold">صياغة</span>
        </Link>

        <div className="rounded-3xl border bg-card p-8 shadow-md">
          <h1 className="text-2xl font-bold">{mode === "signup" ? "إنشاء حساب جديد" : "تسجيل الدخول"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup" ? "احصل على 50 نقطة مجانية فور التسجيل" : "أهلاً بعودتك! سجّل دخولك للمتابعة"}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">الاسم</Label>
                <div className="relative">
                  <UserIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الكامل" className="pr-10" required />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pr-10" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="pr-10" required />
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
              {loading ? "جاري..." : mode === "signup" ? "إنشاء الحساب" : "دخول"}
              {!loading && <ArrowRight className="h-4 w-4 rotate-180" />}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            {mode === "signup" ? (
              <>
                لديك حساب؟{" "}
                <button onClick={() => setMode("login")} className="font-semibold text-primary hover:underline">
                  سجّل الدخول
                </button>
              </>
            ) : (
              <>
                ليس لديك حساب؟{" "}
                <button onClick={() => setMode("signup")} className="font-semibold text-primary hover:underline">
                  أنشئ حساباً
                </button>
              </>
            )}
          </div>
        </div>

        <Link to="/" className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground">
          ← العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
