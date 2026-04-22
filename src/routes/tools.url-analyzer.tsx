import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ToolRunner } from "@/components/ToolRunner";
import { SelectField } from "@/components/SelectField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { fetchUrlContent } from "@/lib/ai.functions";
import { unwrapServerFn } from "@/lib/server-fn";

export const Route = createFileRoute("/tools/url-analyzer")({
  component: () => (
    <AppLayout>
      <UrlAnalyzer />
    </AppLayout>
  ),
});

function UrlAnalyzer() {
  const [url, setUrl] = useState("");
  const [fetched, setFetched] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("مختصر");
  const fetchUrl = useServerFn(fetchUrlContent);

  const fetchIt = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const raw = await fetchUrl({ data: { url } });
      const r = unwrapServerFn<{ ok: boolean; title?: string; description?: string; text?: string; error?: string }>(raw);
      if (r?.ok) {
        setFetched([r.title, r.description, r.text].filter(Boolean).join("\n\n"));
        toast.success("تم جلب الرابط");
      } else {
        toast.error(r?.error ?? "تعذّر الجلب");
      }
    } finally {
      setLoading(false);
    }
  };

  const tool = mode === "احترافي" ? "url_analyzer_pro" : "url_analyzer_short";

  return (
    <ToolRunner
      tool={tool}
      title="تحليل الروابط"
      description="حوّل رابط منتج أو خدمة إلى محتوى تسويقي جاهز"
      icon={<Search className="h-5 w-5" />}
      inputLabel="محتوى الرابط (مُستخرَج تلقائياً أو يدوياً)"
      inputPlaceholder="إذا فشل الجلب التلقائي، الصق وصف المنتج هنا..."
      defaultPrompt={fetched}
      key={tool + fetched.slice(0, 30)}
      customControls={
        <>
          <div className="space-y-1.5">
            <Label>رابط المنتج</Label>
            <div className="flex gap-2">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
              <Button onClick={fetchIt} disabled={loading || !url} variant="secondary">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "جلب"}
              </Button>
            </div>
          </div>
          <SelectField label="عمق التحليل" value={mode} onChange={setMode} options={["مختصر", "احترافي"]} />
        </>
      }
    />
  );
}
