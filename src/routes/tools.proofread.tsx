import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ToolRunner } from "@/components/ToolRunner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/tools/proofread")({
  component: () => (
    <AppLayout>
      <ToolRunner
        tool="proofread"
        title="تدقيق وتشكيل"
        description="تصحيح إملائي ولغوي مع تشكيل دقيق"
        icon={<CheckCircle2 className="h-5 w-5" />}
        inputLabel="النص المراد تدقيقه"
      />
    </AppLayout>
  ),
});
