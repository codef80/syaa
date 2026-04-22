import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectField } from "@/components/SelectField";
import {
  DIALECTS,
  TONES,
  PLATFORMS,
  TEXT_TYPES,
  PSYCH_TRIGGERS,
  TOOL_COSTS,
} from "@/lib/tools";
import { Wand2, Coins, Copy, Heart, Save, FileDown, Loader2, Link as LinkIcon, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { generateContent, fetchUrlContent } from "@/lib/ai.functions";
import { unwrapServerFn, type GenerateResult } from "@/lib/server-fn";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/studio")({
  component: Studio,
});

function Studio() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [url, setUrl] = useState("");
  const [output, setOutput] = useState("");
  const [outputId, setOutputId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [dialect, setDialect] = useState("بيضاء");
  const [tone, setTone] = useState("شعبي");
  const [platform, setPlatform] = useState("إنستقرام");
  const [textType, setTextType] = useState("منشور سوشيال");
  const [length, setLength] = useState<"قصير" | "متوسط" | "طويل">("متوسط");
  const [variants, setVariants] = useState(1);
  const [includeCTA, setIncludeCTA] = useState(true);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [protectedTerms, setProtectedTerms] = useState("");
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const cost = TOOL_COSTS.studio_generate;
  const generate = useServerFn(generateContent);
  const fetchUrl = useServerFn(fetchUrlContent);

  useEffect(() => {
    if (!user) return;
    supabase.from("product_profiles").select("id, name").eq("user_id", user.id).then(({ data }) => {
      setProducts(data ?? []);
    });
    supabase.from("brand_settings").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.protected_terms && !protectedTerms) setProtectedTerms(data.protected_terms);
    });
    supabase.from("profiles").select("default_dialect, default_platform").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.default_dialect) setDialect(data.default_dialect);
      if (data?.default_platform) setPlatform(data.default_platform);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProduct = async (id: string) => {
    if (!id) return;
    setSelectedProductId(id);
    const { data } = await supabase.from("product_profiles").select("*").eq("id", id).maybeSingle();
    if (data) {
      const desc = [
        `المنتج: ${data.name}`,
        data.description ? `الوصف: ${data.description}` : "",
        data.price ? `السعر: ${data.price}` : "",
        data.features ? `المزايا: ${data.features}` : "",
        data.audience ? `الجمهور: ${data.audience}` : "",
      ].filter(Boolean).join("\n");
      setInput(desc);
      if (data.preferred_tone) setTone(data.preferred_tone);
      if (data.preferred_dialect) setDialect(data.preferred_dialect);
      if (data.protected_terms) setProtectedTerms(data.protected_terms);
      toast.success(`تم تحميل ملف "${data.name}"`);
    }
  };

  const fetchFromUrl = async () => {
    if (!url.trim()) {
      toast.error("الصق رابطاً أولاً");
      return;
    }
    setFetchingUrl(true);
    try {
      const raw = await fetchUrl({ data: { url } });
      const res = unwrapServerFn<{ ok: boolean; title?: string; description?: string; text?: string; error?: string }>(raw);
      if (res?.ok) {
        const text = [res.title, res.description, res.text].filter(Boolean).join("\n\n");
        setInput(text);
        toast.success("تم جلب محتوى الرابط");
      } else {
        toast.error(res?.error ?? "تعذّر الجلب — الصق المحتوى يدوياً");
      }
    } catch {
      toast.error("فشل جلب الرابط");
    } finally {
      setFetchingUrl(false);
    }
  };

  const toggleTrigger = (t: string) => {
    setTriggers((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const run = async () => {
    if (!input.trim()) {
      toast.error("اكتب أو الصق محتوى أولاً");
      return;
    }
    setConfirming(false);
    setLoading(true);
    setOutput("");
    try {
      const raw = await generate({
        data: {
          tool: "studio_generate",
          prompt: input,
          dialect,
          tone,
          platform,
          textType,
          length,
          variants,
          triggers,
          includeCTA,
          protectedTerms: protectedTerms || undefined,
        } as never,
      });
      const res = unwrapServerFn<GenerateResult>(raw);
      if (!res || typeof res.output !== "string" || !res.output.trim()) {
        console.error("Unexpected studio response:", raw);
        throw new Error("لم يصل محتوى من الخادم");
      }
      setOutput(res.output);
      setOutputId(res.id ?? null);
      const used = typeof res.pointsUsed === "number" ? res.pointsUsed : cost;
      toast.success(`تم التوليد! استُهلك ${used} نقطة`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => { navigator.clipboard.writeText(output); toast.success("تم النسخ"); };
  const download = () => {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `siyagha-${Date.now()}.txt`;
    a.click();
  };
  const fav = async () => {
    if (!outputId) return;
    await supabase.from("generated_content").update({ is_favorite: true }).eq("id", outputId);
    toast.success("تمت الإضافة للمفضلة");
  };
  const saveTemplate = async () => {
    if (!output || !user) return;
    await supabase.from("saved_templates").insert({
      user_id: user.id,
      title: `استوديو — ${textType}`,
      content: output,
      category: "studio",
    });
    toast.success("تم حفظ القالب");
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-primary-foreground">
            <Wand2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">استوديو الكتابة</h1>
            <p className="text-sm text-muted-foreground">قلب المنصة — حدّد متطلباتك ودع الذكاء الاصطناعي يبدع</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Input + Output */}
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-5 shadow-soft">
              <Label className="mb-2 block font-semibold">المحتوى المصدر</Label>

              {products.length > 0 && (
                <div className="mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={selectedProductId}
                    onChange={(e) => loadProduct(e.target.value)}
                    className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
                  >
                    <option value="">— اختر منتج محفوظ —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-3 flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://متجرك.com/منتج"
                    className="pr-10"
                  />
                </div>
                <Button onClick={fetchFromUrl} disabled={fetchingUrl} variant="secondary">
                  {fetchingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : "جلب تلقائي"}
                </Button>
              </div>

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب وصف المنتج أو الفكرة أو الصق نصاً سابقاً..."
                rows={8}
                className="resize-none"
              />
            </div>

            {/* Output */}
            <div className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold">المخرجات</h3>
                {output && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={copy} title="نسخ"><Copy className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={fav} title="مفضلة"><Heart className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={saveTemplate} title="حفظ كقالب"><Save className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={download} title="تنزيل"><FileDown className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
              <div className="min-h-[260px] whitespace-pre-wrap rounded-xl border bg-background p-4 text-sm leading-relaxed">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري التوليد...
                  </div>
                ) : output ? (
                  output
                ) : (
                  <span className="text-muted-foreground">ستظهر النتيجة هنا بعد التوليد</span>
                )}
              </div>
            </div>
          </div>

          {/* Settings */}
          <aside className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft lg:sticky lg:top-20 lg:self-start">
            <h3 className="font-bold">إعدادات التوليد</h3>

            <SelectField label="نوع النص" value={textType} onChange={setTextType} options={TEXT_TYPES} />
            <SelectField label="المنصة" value={platform} onChange={setPlatform} options={PLATFORMS} />
            <SelectField label="اللهجة" value={dialect} onChange={setDialect} options={DIALECTS} />
            <SelectField label="نبرة العلامة" value={tone} onChange={setTone} options={TONES} />

            <SelectField
              label="الطول"
              value={length}
              onChange={(v) => setLength(v as typeof length)}
              options={["قصير", "متوسط", "طويل"]}
            />

            <div className="space-y-1.5">
              <Label>عدد النسخ</Label>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setVariants(n)}
                    className={`flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      variants === n ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="cta" checked={includeCTA} onCheckedChange={(c) => setIncludeCTA(!!c)} />
              <Label htmlFor="cta" className="cursor-pointer">إضافة دعوة لاتخاذ إجراء (CTA)</Label>
            </div>

            <div>
              <Label className="mb-2 block">محفزات نفسية</Label>
              <div className="flex flex-wrap gap-1.5">
                {PSYCH_TRIGGERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTrigger(t)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      triggers.includes(t) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="terms">مصطلحات محمية (Brand Lock)</Label>
              <Input
                id="terms"
                value={protectedTerms}
                onChange={(e) => setProtectedTerms(e.target.value)}
                placeholder="افصل بفاصلة..."
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-sm">
              <Coins className="h-4 w-4 text-gold" />
              <span>التكلفة:</span>
              <span className="font-bold">{cost} نقطة</span>
            </div>

            {confirming ? (
              <div className="space-y-2 rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-gold" />
                  <span>سيُستهلك {cost} نقطة. متابعة؟</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={run}>متابعة</Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>إلغاء</Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => (cost >= 18 ? setConfirming(true) : run())} disabled={loading} className="w-full" size="lg">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "توليد"}
              </Button>
            )}
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
