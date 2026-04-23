import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { formatDateVi } from "@/lib/format";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { useListSubscriptionPlanVersions } from "@/queries/useSubscriptionPlan";
import { useAdminForceUpgradePlanVersion } from "@/queries/useSubscription";
import {
  UpgradePlanVersionBodySchema,
  type UpgradePlanVersionBodyType,
} from "@/schemaValidatation/subscription";

interface ForceUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  planId: string;
  currentVersionNo: number;
  onUpgraded?: () => void;
}

function ForceUpgradeDialog({
  open,
  onOpenChange,
  subscriptionId,
  planId,
  currentVersionNo,
  onUpgraded,
}: ForceUpgradeDialogProps) {
  const versionsQuery = useListSubscriptionPlanVersions(
    planId,
    { page: 1, limit: 50, search: undefined },
    Boolean(planId) && open,
  );

  const form = useForm<UpgradePlanVersionBodyType>({
    resolver: zodResolver(UpgradePlanVersionBodySchema),
    defaultValues: { planVersionId: "" },
  });

  useClearServerFieldErrors(form);

  const forceUpgrade = useAdminForceUpgradePlanVersion();

  const allVersions = versionsQuery.data?.data?.data ?? [];
  const upgradableVersions = allVersions.filter(
    (v) => v.versionNo > currentVersionNo,
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset({ planVersionId: "" });
    onOpenChange(next);
  };

  const onSubmit = async (values: UpgradePlanVersionBodyType) => {
    try {
      await forceUpgrade.mutateAsync({
        id: subscriptionId,
        data: values,
      });
      toast.success("Đã nâng cấp phiên bản gói.");
      handleOpenChange(false);
      onUpgraded?.();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse<UpgradePlanVersionBodyType>(error)) {
        handleApiErrorUnprocessentity<UpgradePlanVersionBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Nâng cấp thất bại.");
        return;
      }
      toast.error(getApiErrorMessageVi(error, "Nâng cấp thất bại."));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ép nâng cấp phiên bản gói</DialogTitle>
          <DialogDescription>
            Chọn phiên bản mới hơn phiên bản hiện tại (v{currentVersionNo}).
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <Controller
            name="planVersionId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="plan-version-id">Phiên bản</FieldLabel>
                <FieldContent>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={versionsQuery.isLoading}
                  >
                    <SelectTrigger id="plan-version-id">
                      <SelectValue
                        placeholder={
                          versionsQuery.isLoading
                            ? "Đang tải phiên bản..."
                            : upgradableVersions.length === 0
                              ? "Không có phiên bản mới hơn"
                              : "Chọn phiên bản"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {upgradableVersions.map((v) => (
                        <SelectItem
                          key={v.id}
                          value={v.id}
                        >
                          v{v.versionNo} · hiệu lực {formatDateVi(v.effectiveFrom)}
                          {v.isActive ? " · đang áp dụng" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </FieldContent>
              </Field>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={
                forceUpgrade.isPending ||
                upgradableVersions.length === 0 ||
                !form.watch("planVersionId")
              }
            >
              {forceUpgrade.isPending ? "Đang xử lý..." : "Xác nhận nâng cấp"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ForceUpgradeDialog;
