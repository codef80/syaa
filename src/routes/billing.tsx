import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CreditCard, Coins, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PLAN_DETAILS } from "@/lib/tools";

export const Route = createFileRoute("/billing")({
  component: () => (
    <AppLayout>
      <Billing />
    </AppLayout>
  ),
});

type PlanKey = "basic" | "pro" | "business";
interface SubReq { id: string; plan: PlanKey; amount_sar: number; points_to_grant: number; status: string; created_at: string; notes: string | null }

function Billing() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [requests, setRequests] = useState<SubReq[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    if (!user) return;
    const [bal, reqs] = await Promise.all([
      supabase.from("points_balance").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("subscription_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setBalance(bal.data?.balance ?? 0);
    setRequests((reqs.data ?? []) as SubReq[]);
  };
  useEffect(() => { load(); }, [user]); // eslint-disable-line

  const submit = async () => {
    if (!user || !selectedPlan) return;
    const plan = PLAN_DETAILS[selectedPlan];
    const { error } = await supabase.from("subscription_requests").insert({
      user_id: user.id, plan: selectedPlan, amount_sar: plan.price, points_to_grant: plan.points,
      proof_url: proofUrl || null, notes: notes || null, status: "pending",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("تم إرسال طلبك! سنراجعه ونفعّل باقتك قريباً");
    setSelectedPlan(null); setProofUrl(""); setNotes(""); load();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6 text-primary" /> الباقات والنقاط</h1>
        <p className="text-sm text-muted-foreground">رصيدك الحالي: <span className="font-bold text-foreground">{balance} نقطة</span></p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(PLAN_DETAILS) as PlanKey[]).map((key) => {
          const p = PLAN_DETAILS[key];
          const isPopular = key === "pro";
          return (
            <div key={key} className={`relative rounded-2xl border bg-card p-6 ${isPopular ? "border-primary shadow-glow" : ""}`}>
              {isPopular && <div className="absolute -top-3 right-1/2 translate-x-1/2 rounded-full gradient-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">الأكثر طلباً</div>}
              <h3 className="font-bold">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1"><span className="text-4xl font-black">{p.price}</span><span className="text-sm text-muted-foreground">ريال</span></div>
              <div className="mt-1 text-sm font-semibold text-gold flex items-center gap-1"><Coins className="h-4 w-4" /> {p.points} نقطة</div>
              <Button className="mt-5 w-full" variant={isPopular ? "default" : "outline"} onClick={() => setSelectedPlan(key)}>اشترك الآن</Button>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <div className="space-y-4 rounded-2xl border bg-card p-6">
          <h2 className="font-bold">طلب اشتراك: {PLAN_DETAILS[selectedPlan].name}</h2>
          <div className="rounded-xl bg-muted/60 p-4 text-sm space-y-2">
            <p>قم بتحويل <strong>{PLAN_DETAILS[selectedPlan].price} ريال</strong> إلى:</p>
            <p>🏦 الحساب البنكي: <strong className="font-mono">SA00 0000 0000 0000 0000 0000</strong></p>
            <p>📱 STC Pay: <strong>05XXXXXXXX</strong></p>
            <p className="text-muted-foreground text-xs">سنراجع التحويل ونشحن نقاطك خلال 24 ساعة كحد أقصى.</p>
          </div>
          <div className="space-y-1.5"><Label>رابط إثبات التحويل (اختياري)</Label><Input value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="رابط صورة التحويل" /></div>
          <div className="space-y-1.5"><Label>ملاحظات</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="رقم العملية، اسم المحوّل..." /></div>
          <div className="flex gap-2"><Button onClick={submit}>إرسال الطلب</Button><Button variant="outline" onClick={() => setSelectedPlan(null)}>إلغاء</Button></div>
        </div>
      )}

      <div>
        <h2 className="font-bold mb-3">طلباتي</h2>
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">لا توجد طلبات</div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                <div>
                  <div className="font-semibold">{PLAN_DETAILS[r.plan].name} — {r.amount_sar} ريال</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("ar-SA")}</div>
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${r.status === "approved" ? "text-success" : r.status === "rejected" ? "text-destructive" : "text-gold"}`}>
                  {r.status === "approved" ? <CheckCircle2 className="h-4 w-4" /> : r.status === "rejected" ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  {r.status === "approved" ? "مقبول" : r.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
