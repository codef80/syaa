import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Lightbulb } from "lucide-react";

export const Route = createFileRoute("/inspiration")({
  component: () => (
    <AppLayout>
      <Inspiration />
    </AppLayout>
  ),
});

const EXAMPLES = [
  { category: "إعلان منتج", title: "عطر الملوك", text: "هل سبق وشفت عطر يخلّي الكل يسألك: شو هذي الرائحة؟ 👑\n\nعطر الملوك — مزيج فاخر من العود الكمبودي والمسك الأبيض. يدوم 12 ساعة ويترك أثراً لا يُنسى.\n\nاطلب الآن قبل نفاد الكمية ⏳" },
  { category: "رسالة واتساب", title: "تذكير عميل", text: "مرحبا أبو خالد 👋\nسلتك بانتظارك! خلّينا نوصلها لباب بيتك اليوم.\nاضغط هنا للتأكيد: [رابط]" },
  { category: "تغريدة قصيرة", title: "إطلاق منتج", text: "وأخيراً وصل الجديد 🎉\nمنتجنا الأكثر طلباً صار متوفر مرة ثانية — وبكميات محدودة.\nاحجز نسختك الحين 👇" },
  { category: "خطاف صادم", title: "بداية إعلان", text: "99% من التجار يخسرون 50% من زبائنهم بسبب هذا الخطأ البسيط...\nوإذا كنت منهم، هذا المنشور لك." },
  { category: "CTA قوي", title: "عرض محدود", text: "🔥 آخر 24 ساعة — خصم 40% على كل المجموعة\nالكوبون: GULF40\nاطلب قبل ما يخلص الستوك ⚡" },
  { category: "ردّ على استفسار", title: "ردّ احترافي على السعر", text: "أهلاً وسهلاً 🌹\nسعر المنتج 199 ريال، وفيه عرض اليوم: شراء قطعتين بـ 350 فقط (وفّر 48 ريال).\nنبدأ نجهز طلبك؟" },
];

function Inspiration() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Lightbulb className="h-6 w-6 text-gold" /> لوحة الإلهام</h1>
        <p className="text-sm text-muted-foreground">نماذج وأمثلة لإلهامك في كتابة محتوى تسويقي قوي</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {EXAMPLES.map((e, i) => (
          <div key={i} className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{e.category}</span>
            </div>
            <h3 className="mb-2 font-bold">{e.title}</h3>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{e.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
