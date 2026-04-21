import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/SelectField";
import { Package, Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { DIALECTS, TONES } from "@/lib/tools";

export const Route = createFileRoute("/products")({
  component: () => (
    <AppLayout>
      <Products />
    </AppLayout>
  ),
});

interface Product { id: string; name: string; description: string | null; price: string | null; features: string | null; audience: string | null; protected_terms: string | null; preferred_tone: string | null; preferred_dialect: string | null }

const empty = { name: "", description: "", price: "", features: "", audience: "", protected_terms: "", preferred_tone: "شعبي", preferred_dialect: "بيضاء" };

function Products() {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("product_profiles").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => { load(); }, [user]); // eslint-disable-line

  const save = async () => {
    if (!user || !form.name.trim()) { toast.error("اسم المنتج مطلوب"); return; }
    if (editing) {
      await supabase.from("product_profiles").update(form).eq("id", editing);
      toast.success("تم التحديث");
    } else {
      await supabase.from("product_profiles").insert({ ...form, user_id: user.id });
      toast.success("تم الحفظ");
    }
    setForm({ ...empty }); setEditing(null); setShowForm(false); load();
  };

  const edit = (p: Product) => {
    setEditing(p.id);
    setForm({
      name: p.name, description: p.description ?? "", price: p.price ?? "",
      features: p.features ?? "", audience: p.audience ?? "",
      protected_terms: p.protected_terms ?? "",
      preferred_tone: p.preferred_tone ?? "شعبي", preferred_dialect: p.preferred_dialect ?? "بيضاء",
    });
    setShowForm(true);
  };

  const del = async (id: string) => {
    await supabase.from("product_profiles").delete().eq("id", id);
    toast.success("تم الحذف"); load();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> ملفات المنتجات</h1>
          <p className="text-sm text-muted-foreground">احفظ بيانات منتجاتك لاستخدامها في الاستوديو بنقرة</p>
        </div>
        <Button onClick={() => { setShowForm((v) => !v); setEditing(null); setForm({ ...empty }); }} className="gap-2"><Plus className="h-4 w-4" /> منتج جديد</Button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>اسم المنتج *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>السعر</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="مثال: 199 ريال" /></div>
          </div>
          <div className="space-y-1.5"><Label>الوصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div className="space-y-1.5"><Label>المزايا</Label><Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={2} /></div>
          <div className="space-y-1.5"><Label>الجمهور المستهدف</Label><Input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} placeholder="مثال: سيدات 25-40 سنة" /></div>
          <div className="space-y-1.5"><Label>مصطلحات محمية</Label><Input value={form.protected_terms} onChange={(e) => setForm({ ...form, protected_terms: e.target.value })} placeholder="افصل بفاصلة" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="النبرة المفضلة" value={form.preferred_tone} onChange={(v) => setForm({ ...form, preferred_tone: v })} options={TONES} />
            <SelectField label="اللهجة المفضلة" value={form.preferred_dialect} onChange={(v) => setForm({ ...form, preferred_dialect: v })} options={DIALECTS} />
          </div>
          <div className="flex gap-2"><Button onClick={save}>{editing ? "تحديث" : "حفظ"}</Button><Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>إلغاء</Button></div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-muted-foreground">لا توجد منتجات محفوظة</div>
        ) : items.map((p) => (
          <div key={p.id} className="rounded-2xl border bg-card p-5">
            <div className="flex items-start justify-between">
              <h3 className="font-bold">{p.name}</h3>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => edit(p)}><Edit2 className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
            {p.price && <p className="mt-1 text-sm font-semibold text-gold">{p.price}</p>}
            {p.description && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>}
            <div className="mt-3 flex flex-wrap gap-1 text-xs">
              {p.preferred_tone && <span className="rounded-full bg-muted px-2 py-0.5">{p.preferred_tone}</span>}
              {p.preferred_dialect && <span className="rounded-full bg-muted px-2 py-0.5">{p.preferred_dialect}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
