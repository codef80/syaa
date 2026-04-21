import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ToolRunner } from "@/components/ToolRunner";
import { SelectField } from "@/components/SelectField";
import { Languages } from "lucide-react";
import { DIALECTS } from "@/lib/tools";

export const Route = createFileRoute("/tools/dialect")({
  component: () => {
    const [dialect, setDialect] = useState("نجدي");
    return (
      <AppLayout>
        <ToolRunner
          tool="dialect_switcher"
          title="محول اللهجات"
          description="حوّل أي نص لأي لهجة عربية أو خليجية"
          icon={<Languages className="h-5 w-5" />}
          inputLabel="النص الأصلي"
          extraOptions={{ dialect }}
          customControls={<SelectField label="اللهجة المستهدفة" value={dialect} onChange={setDialect} options={DIALECTS} />}
        />
      </AppLayout>
    );
  },
});
