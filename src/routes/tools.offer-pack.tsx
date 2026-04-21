import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ToolRunner } from "@/components/ToolRunner";
import { Package } from "lucide-react";

export const Route = createFileRoute("/tools/offer-pack")({
  component: () => (
    <AppLayout>
      <ToolRunner
        tool="offer_pack"
        title="حزمة عرض كاملة"
        description="عنوان + وصف + مزايا + CTA + واتساب + تغريدة"
        icon={<Package className="h-5 w-5" />}
        inputLabel="بيانات المنتج/الخدمة"
        inputPlaceholder="اسم المنتج، السعر، المزايا، الجمهور..."
      />
    </AppLayout>
  ),
});
