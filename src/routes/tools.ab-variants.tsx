import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ToolRunner } from "@/components/ToolRunner";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/tools/ab-variants")({
  component: () => (
    <AppLayout>
      <ToolRunner
        tool="ab_variants"
        title="نسخ A / B / C"
        description="3 نسخ مختلفة لاختبار الأفضل أداءً"
        icon={<Zap className="h-5 w-5" />}
        inputLabel="الرسالة الأصلية"
      />
    </AppLayout>
  ),
});
