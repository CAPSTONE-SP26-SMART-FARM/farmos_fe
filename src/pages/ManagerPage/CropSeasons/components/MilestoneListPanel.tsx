import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { addDays, format, isAfter, startOfDay } from "date-fns";
import { toast } from "sonner";
import {
  useManagerDeleteProductionMilestone,
  useManagerListProductionMilestones,
  useManagerUpdateProductionMilestone,
} from "@/queries/useProductionMilestone";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import { type CropSeasonType, ProductionStatusName } from "@/types/cropSeason";
import { parseBackendDate } from "./helpers";
import {
  MilestoneEditDialog,
  type MilestoneEditFormState,
} from "./MilestoneEditDialog";
import { MilestoneCreateDialog } from "./MilestoneCreateDialog";
import { MilestoneTemplateApplyDialog } from "./MilestoneTemplateApplyDialog";
import { MilestoneCard } from "./MilestoneCard";
import { useReorderMilestones } from "./useReorderMilestones";

type QuickAction =
  | { kind: "start"; milestone: ProductionMilestoneResType }
  | { kind: "complete"; milestone: ProductionMilestoneResType }
  | null;

export function MilestoneListPanel({
  cropSeason,
  zoneId,
  readOnly = false,
}: {
  cropSeason: CropSeasonType;
  zoneId: string;
  readOnly?: boolean;
}) {
  const navigate = useNavigate();

  const listQuery = useManagerListProductionMilestones(cropSeason.id, {
    page: 1,
    limit: 50,
  });

  const isPlanningState =
    cropSeason.status === ProductionStatusName.Planning ||
    cropSeason.status === ProductionStatusName.Rejected;
  const isApprovedCropSeason =
    cropSeason.status === ProductionStatusName.Approved;
  const isActiveCropSeason = cropSeason.status === ProductionStatusName.Active;
  const canRunOperationalActions =
    !readOnly && (isApprovedCropSeason || isActiveCropSeason);
  const canEditConfig = !readOnly && isPlanningState;

  const {
    ordered: orderedMilestones,
    isReordering,
    draggingId,
    dragOverId,
    moveByOffset,
    dragHandlers,
    totalItems,
  } = useReorderMilestones(cropSeason.id, listQuery, canEditConfig);

  const updateMutation = useManagerUpdateProductionMilestone(cropSeason.id);
  // Silent variant cho step 2 của "Bắt đầu mốc": sau khi BE đã activate
  // season + chuyển milestone sang in_progress, gửi tiếp actualStartDate.
  // Silent để không double-toast (step 1 đã toast "Cập nhật milestone…").
  const updateDateMutation = useManagerUpdateProductionMilestone(cropSeason.id, {
    silent: true,
  });
  const deleteMutation = useManagerDeleteProductionMilestone(cropSeason.id);

  const [createOpen, setCreateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionMilestoneResType | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] =
    useState<ProductionMilestoneResType | null>(null);
  const [quickAction, setQuickAction] = useState<QuickAction>(null);

  // ── URL helper ─────────────────────────────────────────────────────────
  const milestoneUrl = (milestoneId: string) => {
    const p = new URLSearchParams();
    if (zoneId) p.set("zoneId", zoneId);
    const q = p.toString() ? `?${p}` : "";
    const base = `/dashboard/manager/crop-seasons/${cropSeason.id}/milestones/${milestoneId}`;
    return isPlanningState && !readOnly ? `${base}/configure${q}` : `${base}${q}`;
  };

  // ── Edit submit ────────────────────────────────────────────────────────
  // Validate planning: neighbors không được overlap. Validate này chạy trước
  // khi gửi để hiện lỗi sớm với tên mốc cụ thể (BE chỉ trả lỗi generic).
  const findSequenceConflict = (
    milestoneId: string,
    milestoneOrder: number,
    startDate: string | null | undefined,
    endDate: string | null | undefined,
  ) => {
    const parsedStart = parseBackendDate(startDate);
    const parsedEnd = parseBackendDate(endDate);
    if (!parsedStart || !parsedEnd) return null;
    const nextStart = startOfDay(parsedStart).getTime();
    const nextEnd = startOfDay(parsedEnd).getTime();

    const others = orderedMilestones
      .filter((item) => item.id !== milestoneId)
      .slice()
      .sort((a, b) => a.milestoneOrder - b.milestoneOrder);

    const prev = others
      .filter((item) => item.milestoneOrder < milestoneOrder)
      .pop();
    if (prev) {
      const prevEnd = parseBackendDate(prev.expectedEndDate);
      if (prevEnd && nextStart <= startOfDay(prevEnd).getTime()) {
        return { milestone: prev, reason: "before" as const };
      }
    }

    const nextItem = others.find(
      (item) => item.milestoneOrder > milestoneOrder,
    );
    if (nextItem) {
      const nextItemStart = parseBackendDate(nextItem.expectedStartDate);
      if (nextItemStart && startOfDay(nextItemStart).getTime() <= nextEnd) {
        return { milestone: nextItem, reason: "after" as const };
      }
    }
    return null;
  };

  // Edit dialog chỉ mở khi planning — actual date của mốc đã chạy được tự
  // động set bởi quick action "Bắt đầu mốc" / "Đánh dấu hoàn thành".
  const handleEditSubmit = (form: MilestoneEditFormState) => {
    if (!editing || !canEditConfig) return;

    if (!form.expectedStartDate || !form.expectedEndDate) {
      toast.error("Ngày bắt đầu và ngày kết thúc dự kiến là bắt buộc.");
      return;
    }
    const parsedStart = parseBackendDate(form.expectedStartDate);
    const parsedEnd = parseBackendDate(form.expectedEndDate);
    if (!parsedStart || !parsedEnd) {
      toast.error("Ngày dự kiến không hợp lệ.");
      return;
    }
    if (!isAfter(startOfDay(parsedEnd), startOfDay(parsedStart))) {
      toast.error("Ngày bắt đầu phải trước ngày kết thúc.");
      return;
    }
    const conflict = findSequenceConflict(
      editing.id,
      editing.milestoneOrder,
      form.expectedStartDate,
      form.expectedEndDate,
    );
    if (conflict) {
      const { milestone, reason } = conflict;
      toast.error(
        reason === "before"
          ? `Ngày bắt đầu phải sau ngày kết thúc của mốc #${milestone.milestoneOrder} (${milestone.stageName}).`
          : `Ngày kết thúc phải trước ngày bắt đầu của mốc #${milestone.milestoneOrder} (${milestone.stageName}).`,
      );
      return;
    }

    updateMutation.mutate(
      {
        milestoneId: editing.id,
        body: {
          stageName: form.stageName,
          milestoneOrder: form.milestoneOrder,
          expectedStartDate: form.expectedStartDate,
          expectedEndDate: form.expectedEndDate,
          status: "pending" as const,
        },
      },
      { onSuccess: () => setEditing(null) },
    );
  };

  // ── Quick actions (start/complete) ─────────────────────────────────────
  // "Bắt đầu" 2-step (theo BR-50 của BE):
  //   1) PUT { status: in_progress } — BE activate season nếu mốc đầu tiên,
  //      rồi chuyển milestone. KHÔNG gửi actualStartDate ở step này vì
  //      MilestoneActualDateRequiresActiveSeasonException khi season chưa active.
  //   2) PUT { actualStartDate: today } — chỉ được phép sau khi season active.
  const runQuickAction = async (action: QuickAction) => {
    if (!action) return;

    if (action.kind === "complete") {
      // Season đã active (vì đã start mốc 1 trước đó) → BE accept
      // actualEndDate trong cùng call, không cần 2-step như "Bắt đầu".
      const today = format(startOfDay(new Date()), "yyyy-MM-dd");
      updateMutation.mutate(
        {
          milestoneId: action.milestone.id,
          body: {
            status: "completed" as const,
            actualEndDate: today,
          },
        },
        { onSuccess: () => setQuickAction(null) },
      );
      return;
    }

    try {
      await updateMutation.mutateAsync({
        milestoneId: action.milestone.id,
        body: { status: "in_progress" as const },
      });
      const today = format(startOfDay(new Date()), "yyyy-MM-dd");
      await updateDateMutation.mutateAsync({
        milestoneId: action.milestone.id,
        body: { actualStartDate: today },
      });
      setQuickAction(null);
    } catch {
      // Toast lỗi đã được mutation hook xử lý (cho call thứ 1).
      // Call thứ 2 silent: nếu lỗi sẽ swallow — accept, vì step 1 đã thành công
      // và data milestone status đã đúng, chỉ thiếu actualStartDate.
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────
  const lastExistingEndDate =
    orderedMilestones.length > 0
      ? orderedMilestones[orderedMilestones.length - 1].expectedEndDate
      : null;
  const nextMilestoneOrder = totalItems + 1;

  // Tuần tự: tại một thời điểm chỉ mốc "đầu tiên chưa completed" được phép
  // bắt đầu / hoàn thành. Khi mốc cuối được hoàn thành, BE auto-transition
  // cropSeason → completed, panel tự khoá toàn bộ action qua
  // `canRunOperationalActions`.
  const activeMilestoneId =
    orderedMilestones.find((m) => m.status !== "completed")?.id ?? null;

  // Min start date trong dialog edit = end date của mốc trước + 1 (cho mode
  // planning). Nếu là mốc đầu thì không cố định.
  const editingPrev = editing
    ? orderedMilestones
        .filter(
          (m) =>
            m.id !== editing.id && m.milestoneOrder < editing.milestoneOrder,
        )
        .sort((a, b) => a.milestoneOrder - b.milestoneOrder)
        .pop()
    : undefined;
  const prevEnd = parseBackendDate(editingPrev?.expectedEndDate);
  const minExpectedStartDate = prevEnd
    ? addDays(startOfDay(prevEnd), 1)
    : undefined;

  // ── Render ─────────────────────────────────────────────────────────────
  if (listQuery.isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  const isEmpty = orderedMilestones.length === 0;

  return (
    <div className="space-y-3">
      {!isEmpty && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Mốc công việc
            <span className="text-sm font-normal text-muted-foreground">
              ({orderedMilestones.length})
            </span>
            {canEditConfig && (
              <span className="text-xs font-normal text-muted-foreground">
                · Kéo thả để sắp xếp
              </span>
            )}
          </h2>

          {canEditConfig && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTemplateOpen(true)}
              >
                <Sparkles className="h-3 w-3 mr-1.5" />
                Áp template
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3 w-3 mr-1.5" />
                Tạo mốc mới
              </Button>
            </div>
          )}
        </div>
      )}

      {isReordering && (
        <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Đang lưu thứ tự mốc mới...
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-md bg-muted/20">
          <Layers className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">Chưa có mốc công việc</p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Tạo mốc để lên kế hoạch và cấu hình thiết bị
          </p>
          {canEditConfig && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3 w-3 mr-1" />
                Tạo mốc
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTemplateOpen(true)}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Áp template
              </Button>
            </div>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {orderedMilestones.map((m, index) => (
            <li key={m.id}>
              <MilestoneCard
                milestone={m}
                draggable={canEditConfig && !isReordering}
                isDragging={draggingId === m.id}
                isDragOver={dragOverId === m.id}
                onDragStart={(e) => dragHandlers.onDragStart(e, m.id)}
                onDragOver={(e) => dragHandlers.onDragOver(e, m.id)}
                onDrop={(e) => dragHandlers.onDrop(e, m.id)}
                onDragEnd={dragHandlers.onDragEnd}
                actions={{
                  canEditConfig,
                  canStart:
                    canRunOperationalActions &&
                    m.id === activeMilestoneId &&
                    m.status === "pending",
                  canComplete:
                    canRunOperationalActions &&
                    m.id === activeMilestoneId &&
                    m.status === "in_progress",
                  isFirst: index === 0,
                  isLast: index === orderedMilestones.length - 1,
                  isReordering,
                  onOpen: () => navigate(milestoneUrl(m.id)),
                  onEdit: () => setEditing(m),
                  onMoveUp: () => void moveByOffset(m.id, -1),
                  onMoveDown: () => void moveByOffset(m.id, 1),
                  onDelete: () => setConfirmDelete(m),
                  onStart: () =>
                    setQuickAction({ kind: "start", milestone: m }),
                  onComplete: () =>
                    setQuickAction({ kind: "complete", milestone: m }),
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      {canEditConfig && (
        <>
          <MilestoneCreateDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            cropSeasonId={cropSeason.id}
            nextMilestoneOrder={nextMilestoneOrder}
            lastExistingEndDate={lastExistingEndDate}
          />
          <MilestoneTemplateApplyDialog
            open={templateOpen}
            onOpenChange={setTemplateOpen}
            cropSeasonId={cropSeason.id}
            nextMilestoneOrder={nextMilestoneOrder}
            lastExistingEndDate={lastExistingEndDate}
            defaultStartDate={cropSeason.plantDate ?? undefined}
            hasExistingMilestones={orderedMilestones.length > 0}
          />
        </>
      )}

      {editing && canEditConfig && (
        <MilestoneEditDialog
          open={!!editing}
          initialValues={{
            stageName: editing.stageName,
            milestoneOrder: editing.milestoneOrder,
            expectedStartDate: editing.expectedStartDate ?? "",
            expectedEndDate: editing.expectedEndDate ?? "",
          }}
          onClose={() => setEditing(null)}
          onSubmit={handleEditSubmit}
          isSubmitting={updateMutation.isPending}
          minExpectedStartDate={minExpectedStartDate}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Xóa mốc?"
        description="Lượt gán IoT và liên kết cảm biến của mốc này cũng sẽ bị xóa."
        confirmLabel="Xóa"
        variant="destructive"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          deleteMutation.mutate(confirmDelete.id, {
            onSuccess: () => setConfirmDelete(null),
          });
        }}
      />

      <ConfirmDialog
        open={!!quickAction}
        title={
          quickAction?.kind === "start"
            ? "Bắt đầu mốc?"
            : "Đánh dấu hoàn thành?"
        }
        description={
          quickAction?.kind === "start"
            ? isApprovedCropSeason &&
              orderedMilestones[0]?.id === quickAction.milestone.id
              ? `Đây là mốc đầu tiên — sau khi bắt đầu, mùa vụ sẽ chuyển sang trạng thái "Đang diễn ra".`
              : `Mốc "${quickAction.milestone.stageName}" sẽ chuyển sang trạng thái "Đang thực hiện".`
            : quickAction?.kind === "complete"
              ? `Mốc "${quickAction.milestone.stageName}" sẽ được đánh dấu "Hoàn thành".`
              : ""
        }
        confirmLabel={
          quickAction?.kind === "start" ? "Bắt đầu" : "Đánh dấu hoàn thành"
        }
        onCancel={() => setQuickAction(null)}
        onConfirm={() => runQuickAction(quickAction)}
      />
    </div>
  );
}
