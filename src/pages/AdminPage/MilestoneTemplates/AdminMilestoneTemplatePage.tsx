import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ChevronRight, Milestone } from "lucide-react";
import type { MilestoneTemplateResType } from "@/schemaValidatation/milestoneTemplate";
import MilestoneTemplateDetail from "./MilestoneTemplateDetail";
import MilestoneTemplateForm from "./MilestoneTemplateForm";
import MilestoneTemplateList from "./MilestoneTemplateList";

type ViewState =
  | { view: "list" }
  | { view: "create" }
  | { view: "detail"; template: MilestoneTemplateResType }
  | { view: "edit"; template: MilestoneTemplateResType };

function AdminMilestoneTemplatePage() {
  const [state, setState] = useState<ViewState>({ view: "list" });

  if (state.view === "detail") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <MilestoneTemplateDetail
          template={state.template}
          onBack={() => setState({ view: "list" })}
          onEdit={(t) => setState({ view: "edit", template: t })}
        />
      </div>
    );
  }

  if (state.view === "create") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <MilestoneTemplateForm onBack={() => setState({ view: "list" })} />
      </div>
    );
  }

  if (state.view === "edit") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <MilestoneTemplateForm
          template={state.template}
          onBack={() => setState({ view: "list" })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-muted/20" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-2">Admin Portal</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Milestone Templates
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Chuẩn hóa các mốc sản xuất mẫu để manager lập kế hoạch mùa vụ
              nhanh hơn, nhất quán hơn.
            </p>
          </div>

          <div className="rounded-xl border bg-background/80 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Chức năng
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm font-medium">
              <Milestone className="h-4 w-4 text-primary" />
              Milestone Templates
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronRight className="h-3 w-3" />
              Tạo, cập nhật và quản lý mẫu theo loại trang trại
            </div>
          </div>
        </div>
      </section>

      <MilestoneTemplateList
        onCreate={() => setState({ view: "create" })}
        onEdit={(template) => setState({ view: "edit", template })}
        onDetail={(template) => setState({ view: "detail", template })}
      />
    </div>
  );
}

export default AdminMilestoneTemplatePage;
