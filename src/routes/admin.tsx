import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, CheckCircle2, XCircle, Users, Coins } from "lucide-react";
import { toast } from "sonner";
import { PLAN_DETAILS } from "@/lib/tools";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AppLayout>
      <Admin />
    </AppLayout>
  ),
});

interface SubReq { id: string; user_id: string; plan: "basic" | "pro" | "business"; amount_sar: number; points_to_grant: number; proof_url: string | null; notes: string | null; status: string; created_at: string }
interface UserRow { id: string; email: string | null; display_name: string | null; balance: number }

function Admin() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"requests" | "users">("requests");
  const [requests, setRequests] = useState<SubReq[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/dashboard" });
  }, [loading, isAdmin, navigate]);

  const load = async () => {
    const { data: reqs } = await supabase.from("subscription_requests").select("*").order("created_at", { ascending: false });
    setRequests((reqs ?? []) as SubReq[]);

    const { data: profiles } = await supabase.from("profiles").select("id, email, display_name");
    const { data: balances } = await supabase.from("points_balance").select("user_id, balance");
    const balMap = new Map((balances ?? []).map((b) => [b.user_id, b.balance]));
    setUsers((profiles ?? []).map((p) => ({
      id: p.id, email: p.email, display_name: p.display_name, balance: balMap.get(p.id) ?? 0,
    })));
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const approve = async (r: SubReq) => {
    // grant points
    await supabase.rpc("grant_points", {
      _user_id: r.user_id, _amount: r.points_to_grant,
      _type: "subscription", _description: `اشتراك ${PLAN_DETAILS[r.plan].name}`,
    });
    await supabase.from("subscription_requests").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", r.id);
    toast.success(`تم تفعيل الباقة وشحن ${r.points_to_grant} نقطة`);
    load();
  };

  const reject = async (r: SubReq) => {
    await supabase.from("subscription_requests").update({ status: "rejected", reviewed_at: new Date().toISOString(), notes: reviewNote[r.id] || r.notes }).eq("id", r.id);
    toast.success("تم رفض الطلب");
    load();
  };

  if (loading || !isAdmin) return <div className="text-center text-muted-foreground">جاري التحقق...</div>;

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-gold" /> لوحة الأدمن</h1>
        <p className="text-sm text-muted-foreground">إدارة الطلبات والمستخدمين</p>
      </div>

      <div className="flex gap-2 border-b">
        <button onClick={() => setTab("requests")} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${tab === "requests" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>طلبات الاشتراك ({pendingCount})</button>
        <button onClick={() => setTab("users")} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${tab === "users" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>المستخدمون ({users.length})</button>
      </div>

      {tab === "requests" ? (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">لا توجد طلبات</div>
          ) : requests.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{PLAN_DETAILS[r.plan].name}</span>
                    <span className="text-sm text-muted-foreground">— {r.amount_sar} ريال / {r.points_to_grant} نقطة</span>
                  </div>
                  <div className="text-xs text-muted-foreground">User ID: {r.user_id.slice(0, 8)}... — {new Date(r.created_at).toLocaleString("ar-SA")}</div>
                  {r.proof_url && <a href={r.proof_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">رابط الإثبات</a>}
                  {r.notes && <p className="rounded bg-muted p-2 text-sm">{r.notes}</p>}
                </div>
                <div className={`text-sm font-semibold ${r.status === "approved" ? "text-success" : r.status === "rejected" ? "text-destructive" : "text-gold"}`}>
                  {r.status === "approved" ? "مقبول" : r.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                </div>
              </div>

              {r.status === "pending" && (
                <div className="mt-4 space-y-2">
                  <Textarea placeholder="ملاحظات (اختياري)..." value={reviewNote[r.id] ?? ""} onChange={(e) => setReviewNote({ ...reviewNote, [r.id]: e.target.value })} rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approve(r)} className="gap-2 bg-success hover:bg-success/90"><CheckCircle2 className="h-4 w-4" /> قبول وشحن نقاط</Button>
                    <Button size="sm" variant="outline" onClick={() => reject(r)} className="gap-2 text-destructive"><XCircle className="h-4 w-4" /> رفض</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">البريد</th><th className="p-3 text-right">الرصيد</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3"><Users className="inline h-4 w-4 ml-1 text-muted-foreground" />{u.display_name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3 font-bold"><Coins className="inline h-3 w-3 text-gold ml-1" />{u.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
