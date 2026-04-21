import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ToolRunner } from "@/components/ToolRunner";
import { Target } from "lucide-react";

export const Route = createFileRoute("/tools/cta")({
  component: () => (
    <AppLayout>
      <ToolRunner
        tool="cta_generator"
        title="صانع CTA"
        description="6 دعوات اتخاذ إجراء قوية ومتنوعة"
        icon={<Target className="h-5 w-5" />}
        inputLabel="السياق التسويقي"
        inputPlaceholder="مثال: عرض خصم 50% على عطور الرجال ينتهي اليوم..."
      />
    </AppLayout>
  ),
});
