import { useEffect, useState, type DragEvent } from "react";
import { toast } from "sonner";
import type { UseQueryResult } from "@tanstack/react-query";
import { useManagerUpdateProductionMilestone } from "@/queries/useProductionMilestone";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";

type ListResult = UseQueryResult<{
  data: {
    data: ProductionMilestoneResType[];
    meta: { totalItems: number };
  };
}>;

/**
 * Quản lý state thứ tự milestone local + 2-phase reorder API call.
 *
 * Lý do 2-phase: backend constraint `milestoneOrder` unique trong cùng
 * cropSeason → không thể swap trực tiếp 2 record. Phase 1 dời tất cả item
 * có thay đổi sang `tempBase = max(order) + 1000 + index` để né constraint.
 * Phase 2 set order cuối + swap ngày dự kiến theo SLOT (ngày dính theo
 * vị trí, không dính theo milestone) để timeline planning ổn định.
 */
export function useReorderMilestones(
  cropSeasonId: string,
  listQuery: ListResult,
  enabled: boolean,
) {
  const serverMilestones = (listQuery.data?.data.data ?? [])
    .slice()
    .sort((a, b) => a.milestoneOrder - b.milestoneOrder);
  const totalItems =
    listQuery.data?.data.meta.totalItems ?? serverMilestones.length;

  const [ordered, setOrdered] = useState<ProductionMilestoneResType[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Khi đang reorder, server data có thể stale do mutation silent — không sync
  // lại để giữ optimistic state.
  useEffect(() => {
    if (isReordering) return;
    setOrdered(serverMilestones);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listQuery.data, isReordering]);

  const reorderMutation = useManagerUpdateProductionMilestone(cropSeasonId, {
    silent: true,
    invalidateOnSuccess: false,
  });

  const reorderById = async (sourceId: string, targetId: string) => {
    const sourceIndex = ordered.findIndex((m) => m.id === sourceId);
    const targetIndex = ordered.findIndex((m) => m.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex)
      return;

    const original = ordered;
    const next = original.slice();
    const [movedItem] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, movedItem);

    const stableOrders = original
      .map((item) => item.milestoneOrder)
      .sort((a, b) => a - b);
    const stableDates = original.map((item) => ({
      expectedStartDate: item.expectedStartDate,
      expectedEndDate: item.expectedEndDate,
    }));
    const nextWithOrder = next.map((item, index) => ({
      ...item,
      milestoneOrder: stableOrders[index],
      expectedStartDate: stableDates[index].expectedStartDate,
      expectedEndDate: stableDates[index].expectedEndDate,
    }));

    const originalById = new Map(
      original.map((item) => [
        item.id,
        {
          milestoneOrder: item.milestoneOrder,
          expectedStartDate: item.expectedStartDate,
          expectedEndDate: item.expectedEndDate,
        },
      ]),
    );

    const changedItems = nextWithOrder
      .filter((item) => {
        const orig = originalById.get(item.id);
        return (
          orig &&
          (orig.milestoneOrder !== item.milestoneOrder ||
            orig.expectedStartDate !== item.expectedStartDate ||
            orig.expectedEndDate !== item.expectedEndDate)
        );
      })
      .map((item) => ({
        id: item.id,
        targetOrder: item.milestoneOrder,
        expectedStartDate: item.expectedStartDate,
        expectedEndDate: item.expectedEndDate,
      }));

    if (!changedItems.length) return;

    setOrdered(nextWithOrder);
    setIsReordering(true);

    try {
      const tempBase =
        Math.max(...original.map((item) => item.milestoneOrder), totalItems) +
        1000;

      for (const [index, item] of changedItems.entries()) {
        await reorderMutation.mutateAsync({
          milestoneId: item.id,
          body: { milestoneOrder: tempBase + index },
        });
      }

      for (const item of changedItems
        .slice()
        .sort((a, b) => a.targetOrder - b.targetOrder)) {
        await reorderMutation.mutateAsync({
          milestoneId: item.id,
          body: {
            milestoneOrder: item.targetOrder,
            expectedStartDate: item.expectedStartDate ?? null,
            expectedEndDate: item.expectedEndDate ?? null,
          },
        });
      }

      await listQuery.refetch();
      toast.success("Đã cập nhật thứ tự mốc.");
    } catch {
      setOrdered(original);
      toast.error("Không thể cập nhật thứ tự mốc. Vui lòng thử lại.");
    } finally {
      setIsReordering(false);
    }
  };

  const moveByOffset = async (milestoneId: string, offset: number) => {
    if (!enabled || isReordering) return;
    const currentIndex = ordered.findIndex((m) => m.id === milestoneId);
    if (currentIndex < 0) return;
    const targetIndex = currentIndex + offset;
    if (targetIndex < 0 || targetIndex >= ordered.length) return;
    const targetId = ordered[targetIndex]?.id;
    if (!targetId) return;
    await reorderById(milestoneId, targetId);
  };

  const dragHandlers = {
    onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => {
      if (!enabled || isReordering) return;
      setDraggingId(id);
      setDragOverId(null);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
    },
    onDragOver: (e: DragEvent<HTMLDivElement>, id: string) => {
      if (!enabled || isReordering || !draggingId) return;
      if (draggingId === id) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverId(id);
    },
    onDrop: async (e: DragEvent<HTMLDivElement>, id: string) => {
      e.preventDefault();
      if (!enabled || isReordering || !draggingId || draggingId === id) {
        setDraggingId(null);
        setDragOverId(null);
        return;
      }
      await reorderById(draggingId, id);
      setDraggingId(null);
      setDragOverId(null);
    },
    onDragEnd: () => {
      setDraggingId(null);
      setDragOverId(null);
    },
  };

  return {
    ordered,
    isReordering,
    draggingId,
    dragOverId,
    moveByOffset,
    dragHandlers,
    totalItems,
  };
}
