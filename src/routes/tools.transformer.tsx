import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ToolRunner } from "@/components/ToolRunner";
import { SelectField } from "@/components/SelectField";
import { Wand2 } from "lucide-react";
import { TEXT_TYPES } from "@/lib/tools";

export const Route = createFileRoute("/tools/transformer")({
  component: () => {
    const [textType, setTextType] = useState("منشور سوشيال");
    return (
      <AppLayout>
        <ToolRunner
          tool="magic_transformer"
          title="المحول السحري"
          description="حوّل أي نص إلى صيغة جديدة تناسب منصتك"
          icon={<Wand2 className="h-5 w-5" />}
          inputLabel="النص الأصلي"
          extraOptions={{ textType }}
          customControls={<SelectField label="حوّل إلى" value={textType} onChange={setTextType} options={TEXT_TYPES} />}
        />
      </AppLayout>
    );
  },
});
