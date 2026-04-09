import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, ChevronRight, Loader2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import useDebounce from "@/hooks/useDebounce";
import { useOwnerListEmployeeTaskTemplates } from "@/queries/useEmployeeTaskTemplate";
import type {
  ListEmployeeTaskTemplatesQueryType,
  EmployeeTaskTemplateResType,
} from "@/schemaValidatation/employeeTaskTemplate";
import EmployeeTaskTemplateDetail from "@/pages/AdminPage/EmployeeTaskTemplates/EmployeeTaskTemplateDetail";

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  low: {
    label: "Thấp",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
  normal: {
    label: "Bình thường",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  high: {
    label: "Cao",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  urgent: {
    label: "Khẩn cấp",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
};

type ViewState =
  | { view: "list" }
  | { view: "detail"; template: EmployeeTaskTemplateResType };

function OwnerEmployeeTaskTemplatesPage() {
  const [state, setState] = useState<ViewState>({ view: "list" });
  const [query, setQuery] = useState<ListEmployeeTaskTemplatesQueryType>({
    page: 1,
    limit: 8,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const effectiveQuery = useMemo(
    () => ({
      ...query,
      search: debouncedSearch || undefined,
    }),
    [query, debouncedSearch],
  );

  const { data, isLoading } = useOwnerListEmployeeTaskTemplates(effectiveQuery);

  const templates = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  if (state.view === "detail") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <EmployeeTaskTemplateDetail
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
            <Badge className="mb-2">Owner</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Template Nhiệm Vụ
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Xem danh sách template nhiệm vụ tiêu chuẩn dành cho nhân viên nông
              trại của bạn.
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
              Chỉ xem — quản lý bởi Admin
            </div>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <div>
            <CardTitle>Template nhiệm vụ nhân viên</CardTitle>
            <CardDescription className="mt-1">
              Danh sách template công việc đang hoạt động
            </CardDescription>
          </div>

          <div className="mt-2 grid gap-2 md:grid-cols-[1fr_140px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên template hoặc mô tả..."
                className="pl-9"
              />
            </div>

            <Select
              value={String(query.limit ?? 8)}
              onValueChange={(value) => {
                setQuery((prev) => ({
                  ...prev,
                  page: 1,
                  limit: Number(value),
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Số mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 / trang</SelectItem>
                <SelectItem value="8">8 / trang</SelectItem>
                <SelectItem value="12">12 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Không tìm thấy template phù hợp.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setState({ view: "detail", template })}
                  className="cursor-pointer rounded-xl border border-border/70 bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
                >
                  <div>
                    <p className="font-medium leading-tight">{template.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="outline">
                        <ClipboardList className="mr-1 h-3 w-3" />
                        Nhiệm vụ
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {template.items.length} nhiệm vụ | Cập nhật{" "}
                      {new Date(template.updatedAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>

                  {template.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  )}

                  {template.items.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {template.items.slice(0, 4).map((item) => {
                        const pMeta =
                          PRIORITY_META[item.priority] ?? PRIORITY_META.normal;
                        return (
                          <span
                            key={item.id}
                            className={`inline-flex max-w-[200px] items-center gap-1 truncate rounded-md px-2 py-0.5 text-xs font-medium ${pMeta.className}`}
                          >
                            {item.title}
                          </span>
                        );
                      })}
                      {template.items.length > 4 && (
                        <Badge variant="secondary">
                          +{template.items.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
              <span>
                Trang {meta.page} / {meta.totalPages} ({meta.totalItems} mục)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasPreviousPage}
                  onClick={() =>
                    setQuery((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasNextPage}
                  onClick={() =>
                    setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OwnerEmployeeTaskTemplatesPage;
