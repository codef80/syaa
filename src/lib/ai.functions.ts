import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TOOL_COSTS, TOOL_MODELS, TOOL_LABELS, type ToolKey } from "@/lib/tools";
import { z } from "zod";

const MODEL_FLASH = "google/gemini-2.5-flash";
const MODEL_PRO = "google/gemini-2.5-pro";

interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callLovableAI(messages: AIChatMessage[], model: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.error("[AI] LOVABLE_API_KEY missing in env");
    throw new Error("LOVABLE_API_KEY غير مُعد");
  }

  let res: Response;
  try {
    res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages }),
      // Workers cap at ~30s; AI Gateway can be slower for Pro reasoning models
      signal: AbortSignal.timeout(45000),
    });
  } catch (fetchErr) {
    console.error("[AI] fetch failed:", fetchErr);
    const msg = fetchErr instanceof Error && fetchErr.name === "TimeoutError"
      ? "انتهت مهلة الاستجابة من خدمة الذكاء الاصطناعي، حاول مرة أخرى"
      : "تعذّر الاتصال بخدمة الذكاء الاصطناعي";
    throw new Error(msg);
  }

  if (res.status === 429) throw new Error("تم تجاوز حد الطلبات، حاول بعد قليل");
  if (res.status === 402) throw new Error("نفدت الأرصدة، يرجى التواصل مع الدعم");
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("[AI] gateway error:", res.status, t.slice(0, 500));
    throw new Error(`فشل توليد المحتوى (${res.status})`);
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = await res.json();
  } catch (parseErr) {
    console.error("[AI] JSON parse failed:", parseErr);
    throw new Error("استجابة غير صالحة من خدمة الذكاء");
  }
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error("[AI] empty content:", JSON.stringify(data).slice(0, 500));
    throw new Error("لم يُرجع المحتوى");
  }
  return content;
}

function buildSystemPrompt(opts: {
  dialect?: string;
  tone?: string;
  brandVoice?: string;
  protectedTerms?: string;
}): string {
  const parts = [
    "أنت كاتب محتوى تسويقي محترف للسوق السعودي والخليجي.",
    "اكتب بلغة عربية طبيعية، مباشرة، وغير متكلفة.",
    "لا تستخدم الإيموجي بكثرة (واحد أو اثنان كحد أقصى عند الحاجة).",
    "ركّز على البيع والتحويل، لا على الحشو والكلام الإنشائي.",
  ];
  if (opts.dialect) parts.push(`اللهجة المطلوبة: ${opts.dialect}.`);
  if (opts.tone) parts.push(`نبرة العلامة: ${opts.tone}.`);
  if (opts.brandVoice) parts.push(`وصف نبرة العلامة: ${opts.brandVoice}`);
  if (opts.protectedTerms?.trim()) {
    parts.push(`مصطلحات محمية يُمنع تغييرها أو إعادة صياغتها: ${opts.protectedTerms}`);
  }
  return parts.join("\n");
}

const inputSchema = z.object({
  tool: z.string(),
  prompt: z.string().min(1).max(8000),
  dialect: z.string().optional(),
  tone: z.string().optional(),
  platform: z.string().optional(),
  textType: z.string().optional(),
  length: z.enum(["قصير", "متوسط", "طويل"]).optional(),
  variants: z.number().int().min(1).max(3).optional(),
  triggers: z.array(z.string()).optional(),
  includeCTA: z.boolean().optional(),
  brandVoice: z.string().optional(),
  protectedTerms: z.string().optional(),
  templateRef: z.string().optional(),
});

export const generateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tool = data.tool as ToolKey;
    const cost = TOOL_COSTS[tool];
    console.log(`[generate] tool=${tool} user=${userId} cost=${cost}`);
    if (!cost) throw new Error(`أداة غير معروفة: ${tool}`);

    // 1. Consume points (atomic) — RPC bypasses RLS via SECURITY DEFINER
    const { data: consumed, error: consumeErr } = await supabase.rpc("consume_points", {
      _user_id: userId,
      _amount: cost,
      _tool: tool,
      _description: TOOL_LABELS[tool] ?? tool,
    });
    if (consumeErr) {
      console.error("[generate] consume_points error:", consumeErr);
      throw new Error(`فشل خصم النقاط: ${consumeErr.message}`);
    }
    if (!consumed) throw new Error("الرصيد غير كافٍ. يرجى ترقية الباقة.");
    console.log(`[generate] points consumed OK`);

    // 2. Build prompt
    const sysPrompt = buildSystemPrompt({
      dialect: data.dialect,
      tone: data.tone,
      brandVoice: data.brandVoice,
      protectedTerms: data.protectedTerms,
    });

    const userPrompt = buildUserPrompt(tool, data);
    const model = TOOL_MODELS[tool] === "pro" ? MODEL_PRO : MODEL_FLASH;

    // 3. Call AI
    let output: string;
    try {
      console.log(`[generate] calling AI model=${model}`);
      output = await callLovableAI(
        [
          { role: "system", content: sysPrompt },
          { role: "user", content: userPrompt },
        ],
        model,
      );
      console.log(`[generate] AI returned ${output.length} chars`);
    } catch (err) {
      console.error("[generate] AI call failed:", err);
      // Refund points on failure
      await supabase.rpc("grant_points", {
        _user_id: userId,
        _amount: cost,
        _type: "refund",
        _description: `استرداد بسبب فشل: ${TOOL_LABELS[tool] ?? tool}`,
      });
      const msg = err instanceof Error ? err.message : "فشل توليد المحتوى";
      throw new Error(msg);
    }

    // 4. Save output
    const { data: saved } = await supabase
      .from("generated_content")
      .insert({
        user_id: userId,
        tool,
        input: data as never,
        output,
        points_used: cost,
      })
      .select("id")
      .single();

    return { output, id: saved?.id, pointsUsed: cost };
  });

function buildUserPrompt(tool: ToolKey, d: z.infer<typeof inputSchema>): string {
  const ctx: string[] = [];
  if (d.platform) ctx.push(`المنصة: ${d.platform}`);
  if (d.textType) ctx.push(`نوع النص: ${d.textType}`);
  if (d.length) ctx.push(`الطول: ${d.length}`);
  if (d.variants && d.variants > 1) ctx.push(`اكتب ${d.variants} نسخ مختلفة (A و B${d.variants > 2 ? " و C" : ""}) للاختيار بينها.`);
  if (d.triggers?.length) ctx.push(`أدمج المحفزات النفسية: ${d.triggers.join("، ")}.`);
  if (d.includeCTA) ctx.push("اختم بدعوة قوية لاتخاذ إجراء (CTA).");
  if (d.templateRef) ctx.push(`اقترب من أسلوب هذا القالب المرجعي:\n"""\n${d.templateRef}\n"""`);

  const ctxBlock = ctx.length ? `\n\nالمتطلبات:\n- ${ctx.join("\n- ")}` : "";

  switch (tool) {
    case "hook_generator":
      return `اكتب 5 خطافات إعلانية جذابة (بدايات إعلان) لهذا المحتوى:\n\n${d.prompt}${ctxBlock}\n\nنوّع الأساليب: استفهامي، صادم، عاطفي، مباشر، حل مشكلة. رقّم كل خطاف.`;
    case "smart_reply":
      return `حوّل استفسار العميل التالي إلى رد تسويقي لبق محفّز للشراء:\n\nالاستفسار:\n${d.prompt}${ctxBlock}`;
    case "dialect_switcher":
      return `أعد صياغة النص التالي باللهجة المحددة، مع الحفاظ على المعنى الكامل:\n\n${d.prompt}${ctxBlock}`;
    case "cta_generator":
      return `اقترح 6 دعوات لاتخاذ إجراء (CTA) قوية ومتنوعة بناءً على هذا السياق:\n\n${d.prompt}${ctxBlock}`;
    case "ab_variants":
      return `اكتب 3 نسخ مختلفة (A، B، C) من نفس الرسالة لاختبار أيها أفضل:\n\n${d.prompt}${ctxBlock}`;
    case "seo_local":
      return `اكتب محتوى محسّن لمحركات البحث للسوق السعودي/الخليجي يستهدف هذا الموضوع:\n\n${d.prompt}\n\nأدمج كلمات مفتاحية محلية بشكل طبيعي، واقترح في النهاية 5 كلمات مفتاحية إضافية.${ctxBlock}`;
    case "offer_pack":
      return `أنشئ حزمة عرض تسويقي كاملة لهذا المنتج/الخدمة:\n\n${d.prompt}\n\nالمخرجات المطلوبة بالترتيب:\n1) عنوان جذاب\n2) وصف قصير\n3) أبرز 4 مزايا\n4) عبارة CTA\n5) نسخة واتساب جاهزة للإرسال\n6) تغريدة قصيرة\n\nاستخدم فواصل واضحة بين الأقسام.${ctxBlock}`;
    case "weekly_plan":
      return `اقترح خطة محتوى لأسبوع كامل (7 أيام) لهذا النشاط:\n\n${d.prompt}\n\nلكل يوم: نوع المحتوى، الفكرة، صياغة مختصرة جاهزة. نوّع بين تعليمي، تسويقي، تفاعلي، ترفيهي، عرضي.${ctxBlock}`;
    case "proofread":
      return `دقّق هذا النص لغوياً وإملائياً وحسّن صياغته دون تغيير المعنى. أضف التشكيل للكلمات المهمة فقط:\n\n${d.prompt}`;
    case "shortener":
      return `اختصر النص التالي مع الحفاظ على الفكرة الأساسية:\n\n${d.prompt}`;
    case "rewrite_light":
      return `أعد صياغة النص التالي بأسلوب جديد ومحسّن:\n\n${d.prompt}${ctxBlock}`;
    case "magic_transformer":
      return `حوّل النص التالي إلى الصيغة المطلوبة (${d.textType ?? "صيغة تسويقية"}) مع الحفاظ على الجوهر:\n\n${d.prompt}${ctxBlock}`;
    case "url_analyzer_short":
    case "url_analyzer_pro":
      return `حلّل المحتوى التالي المستخرج من رابط منتج/خدمة، وأنشئ ${
        tool === "url_analyzer_pro" ? "تحليلاً تسويقياً متعمقاً" : "ملخصاً تسويقياً"
      } يشمل:\n- وصف تسويقي مكثف\n- 4 نقاط بيع رئيسية\n- 3 مزايا تنافسية\n- نسخة واتساب\n- تغريدة\n\nالمحتوى:\n${d.prompt}${ctxBlock}`;
    case "studio_generate":
    default:
      return `اكتب محتوى تسويقياً عالي الجودة بناءً على المدخلات التالية:\n\n${d.prompt}${ctxBlock}`;
  }
}

// ====== URL Analyzer fetch ======
const urlSchema = z.object({ url: z.string().url("رابط غير صحيح") });

export const fetchUrlContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => urlSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const res = await fetch(data.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SiyaghaBot/1.0)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return { ok: false, error: `فشل جلب الصفحة (${res.status})` };
      const html = await res.text();

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);

      // Strip scripts/styles, then tags
      const stripped = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 4000);

      return {
        ok: true as const,
        title: titleMatch?.[1] ?? ogTitle?.[1] ?? "",
        description: descMatch?.[1] ?? ogDesc?.[1] ?? "",
        text: stripped,
      };
    } catch (err) {
      console.error("fetchUrl error:", err);
      return { ok: false as const, error: "تعذّر جلب الرابط. الرجاء لصق الوصف يدوياً." };
    }
  });
