import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ToolRunner } from "@/components/ToolRunner";
import { Hash } from "lucide-react";

export const Route = createFileRoute("/tools/hooks")({
  component: () => (
    <AppLayout>
      <ToolRunner
        tool="hook_generator"
        title="صانع الخطافات"
        description="5 بدايات إعلانية جذابة لمحتواك"
        icon={<Hash className="h-5 w-5" />}
        inputLabel="موضوع المحتوى أو المنتج"
        inputPlaceholder="مثال: عطر فاخر للرجال، رائحة عودية مميزة..."
      />
    </AppLayout>
  ),
});
