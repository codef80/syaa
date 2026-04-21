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
import { Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { DIALECTS, TONES, PLATFORMS } from "@/lib/tools";

export const Route = createFileRoute("/settings")({
  component: () => (
    <AppLayout>
      <Settings />
    </AppLayout>
  ),
});

function Settings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [defaultDialect, setDefaultDialect] = useState("بيضاء");
  const [defaultPlatform, setDefaultPlatform] = useState("إنستقرام");
  const [brandVoice, setBrandVoice] = useState("شعبي");
  const [brandDescription, setBrandDescription] = useState("");
  const [protectedTerms, setProtectedTerms] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("brand_settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]).then(([p, b]) => {
      if (p.data) {
        setDisplayName(p.data.display_name ?? "");
        setDefaultDialect(p.data.default_dialect ?? "بيضاء");
        setDefaultPlatform(p.data.default_platform ?? "إنستقرام");
      }
      if (b.data) {
        setBrandVoice(b.data.brand_voice ?? "شعبي");
        setBrandDescription(b.data.brand_description ?? "");
        setProtectedTerms(b.data.protected_terms ?? "");
      }
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    await supabase.from("profiles").update({
      display_name: displayName, default_dialect: defaultDialect, default_platform: defaultPlatform,
    }).eq("id", user.id);
    await supabase.from("brand_settings").upsert({
      user_id: user.id, brand_voice: brandVoice, brand_description: brandDescription, protected_terms: protectedTerms,
    });
    toast.success("تم حفظ الإعدادات");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><SettingsIcon className="h-6 w-6 text-primary" /> الإعدادات</h1>
        <p className="text-sm text-muted-foreground">خصّص نبرة علامتك ولهجتك المفضلة</p>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-6">
        <h2 className="font-bold">الملف الشخصي</h2>
        <div className="space-y-1.5"><Label>الاسم</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
        <SelectField label="اللهجة الافتراضية" value={defaultDialect} onChange={setDefaultDialect} options={DIALECTS} />
        <SelectField label="المنصة المفضلة" value={defaultPlatform} onChange={setDefaultPlatform} options={PLATFORMS} />
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-6">
        <h2 className="font-bold">نبرة العلامة (Brand Voice)</h2>
        <SelectField label="النبرة الأساسية" value={brandVoice} onChange={setBrandVoice} options={TONES} />
        <div className="space-y-1.5">
          <Label>وصف نبرة علامتك</Label>
          <Textarea value={brandDescription} onChange={(e) => setBrandDescription(e.target.value)} rows={3} placeholder="مثال: علامة شبابية، أسلوب ودود ومرح، تستخدم لغة بسيطة..." />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-6">
        <h2 className="font-bold">قفل المصطلحات (Brand Terms Lock)</h2>
        <p className="text-sm text-muted-foreground">المصطلحات التي يُمنع تغييرها أو إعادة صياغتها</p>
        <Textarea value={protectedTerms} onChange={(e) => setProtectedTerms(e.target.value)} rows={3} placeholder="افصل بفاصلة. مثال: عطر الملوك، عود كمبودي، التوصيل المجاني" />
      </div>

      <Button onClick={save} size="lg">حفظ كل الإعدادات</Button>
    </div>
  );
}
