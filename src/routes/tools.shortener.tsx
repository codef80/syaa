import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ToolRunner } from "@/components/ToolRunner";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/tools/shortener")({
  component: () => (
    <AppLayout>
      <ToolRunner
        tool="shortener"
        title="اختصار النص"
        description="اختصر النصوص الطويلة مع الحفاظ على الفكرة"
        icon={<Zap className="h-5 w-5" />}
        inputLabel="النص الطويل"
      />
    </AppLayout>
  ),
});
