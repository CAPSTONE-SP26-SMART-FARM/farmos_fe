import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import useDebounce from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { useManagerCreateEmployeeTaskBatch } from "@/queries/useEmployeeTask";
import {
  useManagerEmployeeTaskTemplateDetail,
  useManagerListEmployeeTaskTemplates,
} from "@/queries/useEmployeeTaskTemplate";
import type {
  CreateEmployeeTaskItemType,
  TaskPriorityType,
} from "@/schemaValidatation/employeeTask";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PRIORITY_META } from "./task-meta";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestoneId: string;
  onApplied: () => void;
}

const TEMPLATE_PAGE_SIZE = 8;

function ApplyTemplateDialog({
  open,
  onOpenChange,
  milestoneId,
  onApplied,
}: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Reset state when dialog closes.
  useEffect(() => {
    if (!open) {
      setPage(1);
      setSearch("");
      setSelectedTemplateId("");
    }
  }, [open]);

  const debouncedSearch = useDebounce(search, 400);
  const listQuery = useMemo(
    () => ({
      page,
      limit: TEMPLATE_PAGE_SIZE,
      search: debouncedSearch || undefined,
    }),
    [page, debouncedSearch],
  );

  const templateList = useManagerListEmployeeTaskTemplates(listQuery);
  const templateDetail = useManagerEmployeeTaskTemplateDetail(
    selectedTemplateId,
    !!selectedTemplateId,
  );
  const createBatch = useManagerCreateEmployeeTaskBatch(milestoneId);

  const templates = templateList.data?.data?.data ?? [];
  const meta = templateList.data?.data?.meta;
  const previewItems = templateDetail.data?.data?.items ?? [];

  const handleApply = () => {
    const tasks: CreateEmployeeTaskItemType[] = previewItems.map((item) => ({
      title: item.title,
      description: item.description ?? null,
      priority: item.priority as TaskPriorityType,
    }));

    if (tasks.length === 0) return;

    createBatch.mutate(
      { tasks },
      {
        onSuccess: () => {
          onOpenChange(false);
          onApplied();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Áp dụng mẫu nhiệm vụ</DialogTitle>
          <DialogDescription>
            Chọn một mẫu để thêm nhanh các nhiệm vụ vào mốc. Bạn có thể chỉnh
            sửa lại từng nhiệm vụ sau khi áp dụng.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm mẫu..."
              className="h-9 pl-8"
            />
          </div>

          <div className="mt-3 space-y-2">
            {templateList.isLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center">
                <ClipboardList
                  className="h-6 w-6 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium">
                  Không tìm thấy mẫu nhiệm vụ
                </p>
                <p className="text-xs text-muted-foreground">
                  Thử từ khóa khác hoặc bỏ tìm kiếm.
                </p>
              </div>
            ) : (
              templates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={cn(
                      "w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/50",
                      isSelected && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {tpl.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {tpl.items.length} nhiệm vụ
                          {tpl.description ? ` · ${tpl.description}` : ""}
                        </p>
                      </div>
                      {isSelected && (
                        <Badge variant="default">Đang chọn</Badge>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Trang trước"
              >
                <ChevronLeft
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </Button>
              <span className="text-xs text-muted-foreground">
                {meta.page}/{meta.totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Trang sau"
              >
                <ChevronRight
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </Button>
            </div>
          )}

          {selectedTemplateId && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Xem trước nhiệm vụ</p>
                <span className="text-xs text-muted-foreground">
                  {previewItems.length} nhiệm vụ
                </span>
              </div>
              {templateDetail.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : previewItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Mẫu này chưa có nhiệm vụ nào.
                </p>
              ) : (
                <ol className="space-y-1.5">
                  {previewItems.map((item, idx) => {
                    const meta = PRIORITY_META[item.priority];
                    return (
                      <li
                        key={item.id}
                        className="rounded-md border p-2.5 text-sm"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground">
                            {idx + 1}.
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="line-clamp-2 text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <span
                            className={cn(
                              "shrink-0 text-xs",
                              meta.className,
                            )}
                          >
                            {meta.label}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={createBatch.isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={
              !selectedTemplateId ||
              previewItems.length === 0 ||
              templateDetail.isLoading ||
              createBatch.isPending
            }
            onClick={handleApply}
          >
            {createBatch.isPending
              ? "Đang áp dụng..."
              : previewItems.length > 0
                ? `Áp dụng ${previewItems.length} nhiệm vụ`
                : "Áp dụng mẫu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ApplyTemplateDialog;
