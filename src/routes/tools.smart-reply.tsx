import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ToolRunner } from "@/components/ToolRunner";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/tools/smart-reply")({
  component: () => (
    <AppLayout>
      <ToolRunner
        tool="smart_reply"
        title="بوت الردود الذكية"
        description="ردود تسويقية لبقة على استفسارات العملاء"
        icon={<MessageCircle className="h-5 w-5" />}
        inputLabel="استفسار العميل"
        inputPlaceholder="مثال: كم سعر المنتج؟ متى يوصل؟ هل متوفر؟"
      />
    </AppLayout>
  ),
});
