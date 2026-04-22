import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  Coins,
  FileText,
  BarChart3,
  Pencil,
  Trash2,
  Plus,
  Crown,
  UserMinus,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { PLAN_DETAILS } from "@/lib/tools";

const FLASH_MODELS = [
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (افتراضي)" },
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash Preview" },
] as const;
const PRO_MODELS = [
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (افتراضي)" },
  { value: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" },
] as const;

export const Route = createFileRoute("/admin")({
  component: () => (
    <AppLayout>
      <Admin />
    </AppLayout>
  ),
});

interface SubReq {
  id: string;
  user_id: string;
  plan: "basic" | "pro" | "business";
  amount_sar: number;
  points_to_grant: number;
  proof_url: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}
interface UserRow {
  id: string;
  email: string | null;
  display_name: string | null;
  balance: number;
  is_admin: boolean;
}
interface SystemTpl {
  id: string;
  title: string;
  content: string;
  category: string | null;
  description: string | null;
  is_active: boolean;
}
interface Stats {
  users: number;
  totalSpent: number;
  totalEarned: number;
  contentCount: number;
}

type Tab = "stats" | "requests" | "users" | "templates" | "models";

function Admin() {
  const { isAdmin, loading, user: me } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("stats");
  const [requests, setRequests] = useState<SubReq[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [templates, setTemplates] = useState<SystemTpl[]>([]);
  const [stats, setStats] = useState<Stats>({ users: 0, totalSpent: 0, totalEarned: 0, contentCount: 0 });
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});

  // Dialog states
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [pointsUser, setPointsUser] = useState<UserRow | null>(null);
  const [pointsDelta, setPointsDelta] = useState("");
  const [pointsReason, setPointsReason] = useState("");
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [editTpl, setEditTpl] = useState<SystemTpl | null>(null);
  const [deleteTpl, setDeleteTpl] = useState<SystemTpl | null>(null);
  const [flashModel, setFlashModel] = useState<string>("google/gemini-2.5-flash");
  const [proModel, setProModel] = useState<string>("google/gemini-2.5-pro");
  const [savingModels, setSavingModels] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/dashboard" });
  }, [loading, isAdmin, navigate]);

  const load = async () => {
    const [reqsRes, profilesRes, balancesRes, rolesRes, tplsRes, contentRes, modelsRes] = await Promise.all([
      supabase.from("subscription_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, email, display_name"),
      supabase.from("points_balance").select("user_id, balance, total_earned, total_spent"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("system_templates").select("*").order("created_at", { ascending: false }),
      supabase.from("generated_content").select("id", { count: "exact", head: true }),
      supabase.from("ai_model_settings").select("flash_model, pro_model").maybeSingle(),
    ]);

    if (modelsRes.data) {
      setFlashModel(modelsRes.data.flash_model);
      setProModel(modelsRes.data.pro_model);
    }

    setRequests((reqsRes.data ?? []) as SubReq[]);

    const balMap = new Map((balancesRes.data ?? []).map((b) => [b.user_id, b.balance]));
    const adminSet = new Set((rolesRes.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
    setUsers(
      (profilesRes.data ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        display_name: p.display_name,
        balance: balMap.get(p.id) ?? 0,
        is_admin: adminSet.has(p.id),
      })),
    );

    setTemplates((tplsRes.data ?? []) as SystemTpl[]);

    const totalEarned = (balancesRes.data ?? []).reduce((s, b) => s + (b.total_earned ?? 0), 0);
    const totalSpent = (balancesRes.data ?? []).reduce((s, b) => s + (b.total_spent ?? 0), 0);
    setStats({
      users: profilesRes.data?.length ?? 0,
      totalSpent,
      totalEarned,
      contentCount: contentRes.count ?? 0,
    });
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  // === Subscription Requests ===
  const approve = async (r: SubReq) => {
    await supabase.rpc("grant_points", {
      _user_id: r.user_id,
      _amount: r.points_to_grant,
      _type: "subscription",
      _description: `اشتراك ${PLAN_DETAILS[r.plan].name}`,
    });
    await supabase
      .from("subscription_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", r.id);
    toast.success(`تم تفعيل الباقة وشحن ${r.points_to_grant} نقطة`);
    load();
  };

  const reject = async (r: SubReq) => {
    await supabase
      .from("subscription_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        notes: reviewNote[r.id] || r.notes,
      })
      .eq("id", r.id);
    toast.success("تم رفض الطلب");
    load();
  };

  // === User Management ===
  const saveProfile = async () => {
    if (!editUser) return;
    const { error } = await supabase.rpc("admin_update_profile", {
      _target_user_id: editUser.id,
      _display_name: editUser.display_name ?? "",
      _email: editUser.email ?? "",
    });
    if (error) return toast.error(error.message);
    toast.success("تم تحديث البيانات");
    setEditUser(null);
    load();
  };

  const adjustPoints = async () => {
    if (!pointsUser) return;
    const delta = parseInt(pointsDelta, 10);
    if (isNaN(delta) || delta === 0) return toast.error("أدخل قيمة صحيحة");
    const { error } = await supabase.rpc("admin_adjust_points", {
      _target_user_id: pointsUser.id,
      _delta: delta,
      _description: pointsReason || (delta > 0 ? "إضافة يدوية من الأدمن" : "خصم يدوي من الأدمن"),
    });
    if (error) return toast.error(error.message);
    toast.success(`تم ${delta > 0 ? "إضافة" : "خصم"} ${Math.abs(delta)} نقطة`);
    setPointsUser(null);
    setPointsDelta("");
    setPointsReason("");
    load();
  };

  const toggleAdmin = async (u: UserRow) => {
    const newRole = u.is_admin ? "user" : "admin";
    const { error } = await supabase.rpc("admin_set_role", {
      _target_user_id: u.id,
      _new_role: newRole,
    });
    if (error) return toast.error(error.message);
    toast.success(u.is_admin ? "تم إزالة صلاحية الأدمن" : "تم منح صلاحية الأدمن");
    load();
  };

  const confirmDeleteUser = async () => {
    if (!deleteUser) return;
    const { error } = await supabase.rpc("admin_delete_user", { _target_user_id: deleteUser.id });
    if (error) return toast.error(error.message);
    toast.success("تم حذف المستخدم نهائياً");
    setDeleteUser(null);
    load();
  };

  // === System Templates ===
  const saveTemplate = async () => {
    if (!editTpl) return;
    if (!editTpl.title.trim() || !editTpl.content.trim()) return toast.error("العنوان والمحتوى مطلوبان");
    if (editTpl.id) {
      const { error } = await supabase
        .from("system_templates")
        .update({
          title: editTpl.title,
          content: editTpl.content,
          category: editTpl.category,
          description: editTpl.description,
          is_active: editTpl.is_active,
        })
        .eq("id", editTpl.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("system_templates").insert({
        title: editTpl.title,
        content: editTpl.content,
        category: editTpl.category,
        description: editTpl.description,
        is_active: editTpl.is_active,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("تم الحفظ");
    setEditTpl(null);
    load();
  };

  const confirmDeleteTpl = async () => {
    if (!deleteTpl) return;
    const { error } = await supabase.from("system_templates").delete().eq("id", deleteTpl.id);
    if (error) return toast.error(error.message);
    toast.success("تم حذف القالب");
    setDeleteTpl(null);
    load();
  };

  // === AI Models ===
  const saveModels = async () => {
    setSavingModels(true);
    const { error } = await supabase.rpc("admin_update_ai_models", {
      _flash_model: flashModel,
      _pro_model: proModel,
    });
    setSavingModels(false);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ إعدادات النماذج");
  };

  if (loading || !isAdmin)
    return <div className="text-center text-muted-foreground">جاري التحقق...</div>;

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck className="h-6 w-6 text-gold" /> لوحة الأدمن
        </h1>
        <p className="text-sm text-muted-foreground">تحكم كامل بالنظام والمستخدمين والمحتوى</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b">
        {(
          [
            { k: "stats", l: "الإحصائيات", i: BarChart3 },
            { k: "requests", l: `الطلبات (${pendingCount})`, i: Coins },
            { k: "users", l: `المستخدمون (${users.length})`, i: Users },
            { k: "templates", l: `القوالب (${templates.length})`, i: FileText },
            { k: "models", l: "النماذج", i: Cpu },
          ] as const
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === t.k ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            <t.i className="h-4 w-4" />
            {t.l}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === "stats" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "إجمالي المستخدمين", v: stats.users, i: Users, c: "text-primary" },
            { l: "نقاط ممنوحة", v: stats.totalEarned, i: Plus, c: "text-success" },
            { l: "نقاط مستهلكة", v: stats.totalSpent, i: Coins, c: "text-gold" },
            { l: "محتوى مولّد", v: stats.contentCount, i: FileText, c: "text-accent-foreground" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.l}</span>
                <s.i className={`h-5 w-5 ${s.c}`} />
              </div>
              <div className="mt-2 text-3xl font-bold">{s.v.toLocaleString("ar-SA")}</div>
            </div>
          ))}
        </div>
      )}

      {/* Requests */}
      {tab === "requests" && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              لا توجد طلبات
            </div>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{PLAN_DETAILS[r.plan].name}</span>
                      <span className="text-sm text-muted-foreground">
                        — {r.amount_sar} ريال / {r.points_to_grant} نقطة
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      User: {users.find((u) => u.id === r.user_id)?.email ?? r.user_id.slice(0, 8)} —{" "}
                      {new Date(r.created_at).toLocaleString("ar-SA")}
                    </div>
                    {r.proof_url && (
                      <a
                        href={r.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        رابط الإثبات
                      </a>
                    )}
                    {r.notes && <p className="rounded bg-muted p-2 text-sm">{r.notes}</p>}
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      r.status === "approved"
                        ? "text-success"
                        : r.status === "rejected"
                          ? "text-destructive"
                          : "text-gold"
                    }`}
                  >
                    {r.status === "approved" ? "مقبول" : r.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                  </div>
                </div>

                {r.status === "pending" && (
                  <div className="mt-4 space-y-2">
                    <Textarea
                      placeholder="ملاحظات (اختياري)..."
                      value={reviewNote[r.id] ?? ""}
                      onChange={(e) => setReviewNote({ ...reviewNote, [r.id]: e.target.value })}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approve(r)} className="gap-2 bg-success hover:bg-success/90">
                        <CheckCircle2 className="h-4 w-4" /> قبول وشحن نقاط
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reject(r)} className="gap-2 text-destructive">
                        <XCircle className="h-4 w-4" /> رفض
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">البريد</th>
                <th className="p-3 text-right">الرصيد</th>
                <th className="p-3 text-right">الدور</th>
                <th className="p-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.display_name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3 font-bold">
                    <Coins className="ml-1 inline h-3 w-3 text-gold" />
                    {u.balance}
                  </td>
                  <td className="p-3">
                    {u.is_admin ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold-foreground">
                        <Crown className="h-3 w-3" /> أدمن
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">مستخدم</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => setEditUser({ ...u })} className="h-7 gap-1 px-2">
                        <Pencil className="h-3 w-3" /> تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPointsUser(u);
                          setPointsDelta("");
                          setPointsReason("");
                        }}
                        className="h-7 gap-1 px-2"
                      >
                        <Coins className="h-3 w-3" /> رصيد
                      </Button>
                      {u.id !== me?.id && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAdmin(u)}
                            className="h-7 gap-1 px-2"
                          >
                            {u.is_admin ? <UserMinus className="h-3 w-3" /> : <Crown className="h-3 w-3" />}
                            {u.is_admin ? "إزالة أدمن" : "ترقية"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteUser(u)}
                            className="h-7 gap-1 px-2 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" /> حذف
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Templates */}
      {tab === "templates" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              onClick={() =>
                setEditTpl({ id: "", title: "", content: "", category: "", description: "", is_active: true })
              }
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> قالب جديد
            </Button>
          </div>
          {templates.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              لا توجد قوالب عامة بعد
            </div>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{t.title}</h3>
                      {t.category && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t.category}</span>
                      )}
                      {!t.is_active && (
                        <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-xs text-destructive">
                          معطّل
                        </span>
                      )}
                    </div>
                    {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm">{t.content}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="outline" onClick={() => setEditTpl({ ...t })} className="h-7 gap-1 px-2">
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteTpl(t)}
                      className="h-7 gap-1 px-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Models */}
      {tab === "models" && (
        <div className="space-y-5">
          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <Cpu className="mt-1 h-5 w-5 text-primary" />
              <div className="flex-1 space-y-1">
                <h2 className="font-bold">إعدادات نماذج الذكاء الاصطناعي</h2>
                <p className="text-sm text-muted-foreground">
                  اختر النموذج المُستخدم لكل فئة. يطبَّق التغيير فوراً على جميع الأدوات.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold">نموذج Flash (للأدوات السريعة)</label>
                <p className="text-xs text-muted-foreground">يُستخدم في: تدقيق، اختصار، إعادة صياغة خفيفة</p>
                <div className="space-y-2">
                  {FLASH_MODELS.map((m) => (
                    <label
                      key={m.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm transition ${
                        flashModel === m.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="flash"
                        value={m.value}
                        checked={flashModel === m.value}
                        onChange={() => setFlashModel(m.value)}
                      />
                      <span className="font-medium">{m.label}</span>
                      <code className="ml-auto text-xs text-muted-foreground">{m.value}</code>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold">نموذج Pro (للأدوات الاحترافية)</label>
                <p className="text-xs text-muted-foreground">يُستخدم في: تحليل روابط، خطافات، CTA، خطة أسبوعية، استوديو…</p>
                <div className="space-y-2">
                  {PRO_MODELS.map((m) => (
                    <label
                      key={m.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm transition ${
                        proModel === m.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="pro"
                        value={m.value}
                        checked={proModel === m.value}
                        onChange={() => setProModel(m.value)}
                      />
                      <span className="font-medium">{m.label}</span>
                      <code className="ml-auto text-xs text-muted-foreground">{m.value}</code>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button onClick={saveModels} disabled={savingModels} className="gap-2">
                {savingModels ? "جاري الحفظ..." : "حفظ الإعدادات"}
              </Button>
            </div>
          </div>
        </div>
      )}


      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">الاسم</label>
                <Input
                  value={editUser.display_name ?? ""}
                  onChange={(e) => setEditUser({ ...editUser, display_name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">البريد الإلكتروني</label>
                <Input
                  type="email"
                  value={editUser.email ?? ""}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              إلغاء
            </Button>
            <Button onClick={saveProfile}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Points Dialog */}
      <Dialog open={!!pointsUser} onOpenChange={(o) => !o && setPointsUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل رصيد {pointsUser?.display_name ?? pointsUser?.email}</DialogTitle>
            <DialogDescription>
              الرصيد الحالي: <strong>{pointsUser?.balance}</strong> نقطة. أدخل قيمة موجبة للإضافة أو سالبة للخصم.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm">عدد النقاط (مثال: 100 أو -50)</label>
              <Input
                type="number"
                value={pointsDelta}
                onChange={(e) => setPointsDelta(e.target.value)}
                placeholder="100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">السبب</label>
              <Input
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                placeholder="هدية ترويجية / تعويض..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPointsUser(null)}>
              إلغاء
            </Button>
            <Button onClick={adjustPoints}>تنفيذ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirm */}
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المستخدم نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف <strong>{deleteUser?.email}</strong> وجميع بياناته (محتوى، نقاط، قوالب، طلبات) بشكل نهائي ولا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive hover:bg-destructive/90">
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editTpl} onOpenChange={(o) => !o && setEditTpl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTpl?.id ? "تعديل قالب" : "قالب جديد"}</DialogTitle>
          </DialogHeader>
          {editTpl && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">العنوان *</label>
                <Input value={editTpl.title} onChange={(e) => setEditTpl({ ...editTpl, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm">الفئة</label>
                  <Input
                    value={editTpl.category ?? ""}
                    onChange={(e) => setEditTpl({ ...editTpl, category: e.target.value })}
                    placeholder="إعلانات، منشورات..."
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editTpl.is_active}
                      onChange={(e) => setEditTpl({ ...editTpl, is_active: e.target.checked })}
                    />
                    قالب نشط
                  </label>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm">الوصف</label>
                <Input
                  value={editTpl.description ?? ""}
                  onChange={(e) => setEditTpl({ ...editTpl, description: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">المحتوى *</label>
                <Textarea
                  value={editTpl.content}
                  onChange={(e) => setEditTpl({ ...editTpl, content: e.target.value })}
                  rows={8}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTpl(null)}>
              إلغاء
            </Button>
            <Button onClick={saveTemplate}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirm */}
      <AlertDialog open={!!deleteTpl} onOpenChange={(o) => !o && setDeleteTpl(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف القالب؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف "<strong>{deleteTpl?.title}</strong>" نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTpl} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
