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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import {
  useOwnerCreateZone,
  useOwnerListZones,
  useOwnerUpdateZone,
} from "@/queries/useZone";
import {
  CreateZoneBodySchema,
  UpdateZoneBodySchema,
  type CreateZoneBodyType,
  type UpdateZoneBodyType,
  type ZoneType,
} from "@/schemaValidatation/zone";
import { useFarmStore } from "@/stores/farmStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

type Props =
  | {
      mode: "create";
      farmCode: string;
      farmId: string;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }
  | {
      mode: "update";
      zone: ZoneType;
      farmId: string;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    };

export default function ZoneFormDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "create" ? "Tạo khu vực" : "Chỉnh sửa khu vực"}
          </DialogTitle>
          <DialogDescription>
            {props.mode === "create"
              ? "Thêm khu vực mới vào nông trại."
              : "Cập nhật thông tin khu vực."}
          </DialogDescription>
        </DialogHeader>

        {props.mode === "create" ? (
          <CreateZoneBody
            farmCode={props.farmCode}
            farmId={props.farmId}
            onClose={() => props.onOpenChange(false)}
          />
        ) : (
          <UpdateZoneBody
            zone={props.zone}
            farmId={props.farmId}
            onClose={() => props.onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateZoneBody({
  farmCode,
  farmId,
  onClose,
}: {
  farmCode: string;
  farmId: string;
  onClose: () => void;
}) {
  const farmAreaSqm = useFarmStore((s) => s.farm?.areaSqm ?? null);
  const { data: zonesData } = useOwnerListZones(farmId, {
    page: 1,
    limit: 100,
  });
  const usedAreaSqm = useMemo(() => {
    const list = zonesData?.data.data ?? [];
    return list.reduce((sum, z) => sum + (z.areaSqm ?? 0), 0);
  }, [zonesData]);
  const availableAreaSqm =
    farmAreaSqm != null ? Math.max(0, farmAreaSqm - usedAreaSqm) : null;

  const form = useForm<CreateZoneBodyType>({
    resolver: zodResolver(CreateZoneBodySchema),
    defaultValues: {
      farmCode,
      name: "",
      zoneType: "cultivation",
      description: "",
    },
  });

  useClearServerFieldErrors(form);
  const { mutateAsync, isPending } = useOwnerCreateZone(farmId);

  const handleSubmit = async (data: CreateZoneBodyType) => {
    if (
      availableAreaSqm != null &&
      data.areaSqm &&
      data.areaSqm > availableAreaSqm
    ) {
      form.setError("areaSqm", {
        message: `Diện tích khu vực không được vượt quá diện tích còn lại (${availableAreaSqm.toLocaleString()} m²)`,
      });
      return;
    }
    try {
      await mutateAsync(data);
      toast.success("Tạo khu vực thành công");
      onClose();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Không thể tạo khu vực");
      }
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <ZoneFields
        control={form.control}
        farmAreaSqm={farmAreaSqm}
        usedAreaSqm={usedAreaSqm}
        availableAreaSqm={availableAreaSqm}
      />
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tạo...
            </>
          ) : (
            "Tạo khu vực"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function UpdateZoneBody({
  zone,
  farmId,
  onClose,
}: {
  zone: ZoneType;
  farmId: string;
  onClose: () => void;
}) {
  const farmAreaSqm = useFarmStore((s) => s.farm?.areaSqm ?? null);
  const { data: zonesData } = useOwnerListZones(farmId, {
    page: 1,
    limit: 100,
  });
  const usedAreaSqm = useMemo(() => {
    const list = zonesData?.data.data ?? [];
    return list
      .filter((z) => z.id !== zone.id)
      .reduce((sum, z) => sum + (z.areaSqm ?? 0), 0);
  }, [zonesData, zone.id]);
  const availableAreaSqm =
    farmAreaSqm != null ? Math.max(0, farmAreaSqm - usedAreaSqm) : null;

  const form = useForm<UpdateZoneBodyType>({
    resolver: zodResolver(UpdateZoneBodySchema),
    defaultValues: {
      name: zone.name,
      zoneType: zone.zoneType,
      description: zone.description ?? "",
      areaSqm: zone.areaSqm ?? undefined,
    },
  });

  useEffect(() => {
    form.reset({
      name: zone.name,
      zoneType: zone.zoneType,
      description: zone.description ?? "",
      areaSqm: zone.areaSqm ?? undefined,
    });
  }, [zone, form]);

  useClearServerFieldErrors(form);
  const { mutateAsync, isPending } = useOwnerUpdateZone(zone.id, farmId);

  const handleSubmit = async (data: UpdateZoneBodyType) => {
    if (
      availableAreaSqm != null &&
      data.areaSqm &&
      data.areaSqm > availableAreaSqm
    ) {
      form.setError("areaSqm", {
        message: `Diện tích khu vực không được vượt quá diện tích còn lại (${availableAreaSqm.toLocaleString()} m²)`,
      });
      return;
    }
    try {
      await mutateAsync(data);
      toast.success("Cập nhật khu vực thành công");
      onClose();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(error)) {
        toast.error(
          error.response?.data.message ?? "Không thể cập nhật khu vực",
        );
      }
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <ZoneFields
        control={form.control}
        farmAreaSqm={farmAreaSqm}
        usedAreaSqm={usedAreaSqm}
        availableAreaSqm={availableAreaSqm}
      />
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ZoneFields({
  control,
  farmAreaSqm,
  usedAreaSqm,
  availableAreaSqm,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  farmAreaSqm: number | null;
  usedAreaSqm: number;
  availableAreaSqm: number | null;
}) {
  return (
    <FieldGroup>
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="zone-name">Tên khu vực</FieldLabel>
            <Input
              {...field}
              id="zone-name"
              placeholder="Ví dụ: Khu ruộng phía Bắc"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="areaSqm"
        control={control}
        render={({ field, fieldState }) => {
          const exceeds =
            availableAreaSqm != null &&
            field.value != null &&
            field.value > availableAreaSqm;
          return (
            <Field data-invalid={fieldState.invalid || exceeds}>
              <FieldLabel htmlFor="zone-area">
                Diện tích (m²) — tùy chọn
              </FieldLabel>
              <Input
                id="zone-area"
                type="number"
                step="0.01"
                min="0"
                max={availableAreaSqm ?? undefined}
                placeholder={
                  availableAreaSqm != null
                    ? `Tối đa ${availableAreaSqm.toLocaleString()} m²`
                    : "Ví dụ: 5000"
                }
                value={field.value ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === "" ? undefined : Number(val));
                }}
              />
              {farmAreaSqm != null && availableAreaSqm != null && (
                <p
                  className={`text-xs ${exceeds ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {exceeds ? (
                    <>
                      Vượt quá diện tích còn lại (
                      {availableAreaSqm.toLocaleString()} m²)
                    </>
                  ) : (
                    <>
                      Tổng nông trại: {farmAreaSqm.toLocaleString()} m² • Đã
                      dùng: {usedAreaSqm.toLocaleString()} m² • Còn lại:{" "}
                      <span className="font-medium">
                        {availableAreaSqm.toLocaleString()} m²
                      </span>
                    </>
                  )}
                </p>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          );
        }}
      />

      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="zone-description">
              Mô tả — tùy chọn
            </FieldLabel>
            <Textarea
              {...field}
              id="zone-description"
              placeholder="Mô tả ngắn về khu vực này"
              className="min-h-20"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
}
