import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Coins, Copy, Heart, FileDown, Save, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { generateContent } from "@/lib/ai.functions";
import { TOOL_COSTS, TOOL_LABELS, type ToolKey } from "@/lib/tools";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

interface ToolRunnerProps {
  tool: ToolKey;
  title: string;
  description: string;
  icon: ReactNode;
  inputLabel?: string;
  inputPlaceholder?: string;
  defaultPrompt?: string;
  extraOptions?: Record<string, unknown>;
  customControls?: ReactNode;
  promptBuilder?: (rawInput: string) => string;
}

export function ToolRunner({
  tool,
  title,
  description,
  icon,
  inputLabel = "المدخل",
  inputPlaceholder = "اكتب أو الصق المحتوى هنا...",
  defaultPrompt = "",
  extraOptions = {},
  customControls,
  promptBuilder,
}: ToolRunnerProps) {
  const { user } = useAuth();
  const [input, setInput] = useState(defaultPrompt);
  const [output, setOutput] = useState("");
  const [outputId, setOutputId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const cost = TOOL_COSTS[tool];
  const generate = useServerFn(generateContent);

  const run = async () => {
    if (!input.trim()) {
      toast.error("اكتب محتوى أولاً");
      return;
    }
    if (cost >= 18 && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setLoading(true);
    setOutput("");
    try {
      const finalPrompt = promptBuilder ? promptBuilder(input) : input;
      const raw = (await generate({
        data: { tool, prompt: finalPrompt, ...extraOptions } as never,
      })) as unknown;
      // TanStack Start may wrap server-fn results in { result }
      const res = (raw && typeof raw === "object" && "result" in (raw as Record<string, unknown>)
        ? (raw as { result: { output: string; id?: string; pointsUsed: number } }).result
        : (raw as { output: string; id?: string; pointsUsed: number }));
      if (!res || typeof res.output !== "string") {
        console.error("Unexpected server-fn response:", raw);
        throw new Error("استجابة غير متوقعة من الخادم");
      }
      setOutput(res.output);
      setOutputId(res.id ?? null);
      toast.success(`تم! استُهلك ${res.pointsUsed ?? cost} نقطة`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast.success("تم النسخ");
  };

  const download = () => {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleFavorite = async () => {
    if (!outputId) return;
    const { error } = await supabase.from("generated_content").update({ is_favorite: true }).eq("id", outputId);
    if (error) toast.error("فشل الحفظ");
    else toast.success("تمت الإضافة للمفضلة");
  };

  const saveAsTemplate = async () => {
    if (!output || !user) return;
    const { error } = await supabase.from("saved_templates").insert({
      user_id: user.id,
      title: `${title} — ${new Date().toLocaleDateString("ar-SA")}`,
      content: output,
      category: tool,
    });
    if (error) toast.error("فشل الحفظ");
    else toast.success("تم حفظ القالب");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input panel */}
        <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft">
          <div>
            <label className="mb-2 block text-sm font-semibold">{inputLabel}</label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputPlaceholder}
              rows={8}
              className="resize-none"
            />
          </div>

          {customControls}

          <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4 text-gold" />
              <span>تكلفة العملية:</span>
              <span className="font-bold">{cost} نقطة</span>
            </div>
          </div>

          {confirming && cost >= 18 && (
            <div className="flex gap-3 rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-gold" />
              <div className="flex-1">
                <p className="font-semibold">تنبيه عملية ثقيلة</p>
                <p className="mt-1 text-muted-foreground">
                  هذه الميزة تستخدم ذكاءً متطوراً وتستهلك {cost} نقطة. هل تود المتابعة؟
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={run}>تأكيد المتابعة</Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!confirming && (
            <Button onClick={run} disabled={loading || !input.trim()} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                "توليد المحتوى"
              )}
            </Button>
          )}
        </div>

        {/* Output panel */}
        <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">المخرجات</h3>
            {output && (
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={copy} title="نسخ">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={toggleFavorite} title="مفضلة">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={saveAsTemplate} title="حفظ كقالب">
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={download} title="تنزيل">
                  <FileDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="min-h-[280px] whitespace-pre-wrap rounded-xl border bg-background p-4 text-sm leading-relaxed">
            {output || (
              <span className="text-muted-foreground">
                ستظهر النتيجة هنا بعد التوليد. {TOOL_LABELS[tool]} يستخدم ذكاءً اصطناعياً متقدماً.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
