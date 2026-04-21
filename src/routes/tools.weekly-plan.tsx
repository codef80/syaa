import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ToolRunner } from "@/components/ToolRunner";
import { Calendar } from "lucide-react";

export const Route = createFileRoute("/tools/weekly-plan")({
  component: () => (
    <AppLayout>
      <ToolRunner
        tool="weekly_plan"
        title="الخطة الأسبوعية"
        description="خطة محتوى لأسبوع كامل (7 أيام)"
        icon={<Calendar className="h-5 w-5" />}
        inputLabel="وصف نشاطك التجاري"
        inputPlaceholder="مثال: متجر عطورات نسائي يستهدف الجمهور السعودي..."
      />
    </AppLayout>
  ),
});
