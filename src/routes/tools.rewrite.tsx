import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ToolRunner } from "@/components/ToolRunner";
import { Repeat } from "lucide-react";

export const Route = createFileRoute("/tools/rewrite")({
  component: () => (
    <AppLayout>
      <ToolRunner
        tool="rewrite_light"
        title="إعادة صياغة خفيفة"
        description="صياغة جديدة بنفس المعنى وبأسلوب محسّن"
        icon={<Repeat className="h-5 w-5" />}
        inputLabel="النص"
      />
    </AppLayout>
  ),
});
