import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ToolRunner } from "@/components/ToolRunner";
import { Globe } from "lucide-react";

export const Route = createFileRoute("/tools/seo")({
  component: () => (
    <AppLayout>
      <ToolRunner
        tool="seo_local"
        title="SEO محلي"
        description="محتوى محسّن لمحركات البحث في السوق المحلي"
        icon={<Globe className="h-5 w-5" />}
        inputLabel="الموضوع أو المنتج"
      />
    </AppLayout>
  ),
});
