// src/pages/ManagerPage/CropSeasons/components/TrackingConfigPanel.tsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { isApiErrorResponse } from "@/lib/utils";
import {
  useTrackingAvailableFields,
  useTrackingConfigs,
  usePutTrackingConfigs,
} from "@/queries/useTracking";
import { getFieldLabel, getEntityTypeLabel } from "@/lib/tracking-display";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import LoadingCard from "@/components/common/LoadingCard";
import EmptyState from "@/components/common/EmptyState";
import type { TrackingEntityType } from "@/schemaValidatation/tracking";

interface TrackingConfigPanelProps {
  cropSeasonId: string;
  readOnly?: boolean;
}

export default function TrackingConfigPanel({
  cropSeasonId,
  readOnly = false,
}: TrackingConfigPanelProps) {
  const { data: availableData, isLoading: loadingAvailable } =
    useTrackingAvailableFields(cropSeasonId);
  const { data: configData, isLoading: loadingConfig } =
    useTrackingConfigs(cropSeasonId);
  const { mutateAsync: putConfigs, isPending } =
    usePutTrackingConfigs(cropSeasonId);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  // Sync local state when config data loads
  useEffect(() => {
    const activeConfigs = configData?.data?.data ?? [];
    setSelected(
      new Set(
        activeConfigs
          .filter((c) => c.isActive)
          .map((c) => `${c.entityType}:${c.fieldName}`),
      ),
    );
  }, [configData]);

  const toggleField = (entityType: string, fieldName: string) => {
    if (readOnly) return;
    const key = `${entityType}:${fieldName}`;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = async () => {
    const configs = Array.from(selected).map((key) => {
      const [entityType, fieldName] = key.split(":") as [
        TrackingEntityType,
        string,
      ];
      return { entityType, entityId: null, fieldName };
    });
    try {
      await putConfigs({ configs });
      setShowConfirm(false);
    } catch (error) {
      if (isApiErrorResponse(error)) {
        toast.error(
          (error.response?.data as { message?: string })?.message ??
            "Lưu cấu hình thất bại",
        );
      } else {
        toast.error("Đã có lỗi xảy ra");
      }
    }
  };

  if (loadingAvailable || loadingConfig) return <LoadingCard />;
  if (!availableData?.data?.data?.length) {
    return (
      <EmptyState
        title="Không có trường có thể theo dõi"
        description="Hệ thống chưa cấu hình whitelist theo dõi."
      />
    );
  }

  return (
    <div className="space-y-6">
      {readOnly && (
        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
          Cấu hình theo dõi chỉ có thể thay đổi khi mùa vụ đang ở trạng thái lập
          kế hoạch.
        </p>
      )}

      {availableData.data.data.map((group) => (
        <div
          key={group.entityType}
          className="space-y-2"
        >
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {getEntityTypeLabel(group.entityType)}
          </h4>
          <div className="space-y-2 pl-1">
            {group.fields.map((field) => {
              const key = `${group.entityType}:${field.fieldName}`;
              const isChecked = selected.has(key);
              return (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Checkbox
                    checked={isChecked}
                    disabled={readOnly}
                    onCheckedChange={() =>
                      toggleField(group.entityType, field.fieldName)
                    }
                  />
                  <span className="text-sm flex-1">
                    {getFieldLabel(field.fieldName)}
                  </span>
                  <Badge
                    variant={
                      field.layer === "plan_only" ? "secondary" : "outline"
                    }
                    className="text-xs"
                  >
                    {field.layer === "plan_only" ? "Kế hoạch" : "Thực tế"}
                  </Badge>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {!readOnly && (
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="default"
            className="cursor-pointer"
            onClick={() => setShowConfirm(true)}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lưu cấu hình
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="Xác nhận lưu cấu hình theo dõi"
        description="Lưu sẽ thay thế toàn bộ cấu hình hiện tại. Các trường bỏ chọn sẽ không còn được theo dõi."
        confirmLabel="Lưu cấu hình"
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
