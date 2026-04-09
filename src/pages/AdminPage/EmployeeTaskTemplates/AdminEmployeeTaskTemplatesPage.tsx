import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ClipboardList, ChevronRight } from "lucide-react";
import type { EmployeeTaskTemplateResType } from "@/schemaValidatation/employeeTaskTemplate";
import EmployeeTaskTemplateList from "./EmployeeTaskTemplateList";
import EmployeeTaskTemplateForm from "./EmployeeTaskTemplateForm";
import EmployeeTaskTemplateDetail from "./EmployeeTaskTemplateDetail";

type ViewState =
  | { view: "list" }
  | { view: "create" }
  | { view: "detail"; template: EmployeeTaskTemplateResType }
  | { view: "edit"; template: EmployeeTaskTemplateResType };

function AdminEmployeeTaskTemplatesPage() {
  const [state, setState] = useState<ViewState>({ view: "list" });

  if (state.view === "create") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <EmployeeTaskTemplateForm onBack={() => setState({ view: "list" })} />
      </div>
    );
  }

  if (state.view === "detail") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <EmployeeTaskTemplateDetail
          template={state.template}
          onBack={() => setState({ view: "list" })}
          onEdit={(t) => setState({ view: "edit", template: t })}
        />
      </div>
    );
  }

  if (state.view === "edit") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <EmployeeTaskTemplateForm
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
              Template Nhiệm Vụ Nhân Viên
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Quản lý bộ template nhiệm vụ tiêu chuẩn, chuẩn hóa công việc giao
              cho nhân viên trên toàn hệ thống nông trại.
            </p>
          </div>

          <div className="rounded-xl border bg-background/80 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Chức năng
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm font-medium">
              <ClipboardList className="h-4 w-4 text-primary" />
              Nhiệm vụ nhân viên
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronRight className="h-3 w-3" />
              Tạo, chỉnh sửa và quản lý template
            </div>
          </div>
        </div>
      </section>

      <EmployeeTaskTemplateList
        onCreate={() => setState({ view: "create" })}
        onEdit={(template) => setState({ view: "edit", template })}
        onDetail={(template) => setState({ view: "detail", template })}
      />
    </div>
  );
}

export default AdminEmployeeTaskTemplatesPage;
