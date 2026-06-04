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
import { useOwnerCreateFarm, useOwnerUpdateFarm } from "@/queries/useOwner";
import {
  CreateFarmBodySchema,
  UpdateFarmBodySchema,
  type CreateFarmBodyType,
  type FarmResType,
  type UpdateFarmBodyType,
} from "@/schemaValidatation/farmManagement";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { toast } from "sonner";

type Props =
  | {
      mode: "create";
      farm?: undefined;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }
  | {
      mode: "update";
      farm: FarmResType;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    };

export default function FarmFormDialog(props: Props) {
  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "create" ? "Tạo nông trại" : "Chỉnh sửa nông trại"}
          </DialogTitle>
          <DialogDescription>
            {props.mode === "create"
              ? "Điền thông tin bên dưới để đăng ký nông trại mới."
              : "Cập nhật thông tin nông trại của bạn."}
          </DialogDescription>
        </DialogHeader>

        {props.mode === "create" ? (
          <CreateFarmBody onClose={() => props.onOpenChange(false)} />
        ) : (
          <UpdateFarmBody
            farm={props.farm}
            onClose={() => props.onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateFarmBody({ onClose }: { onClose: () => void }) {
  const form = useForm<CreateFarmBodyType>({
    resolver: zodResolver(CreateFarmBodySchema),
    defaultValues: {
      code: "",
      name: "",
      farmType: "cultivation",
      description: "",
      address: "",
    },
  });

  useClearServerFieldErrors(form);
  const { mutateAsync, isPending } = useOwnerCreateFarm();

  const handleSubmit = async (data: CreateFarmBodyType) => {
    try {
      await mutateAsync(data);
      toast.success("Đã tạo nông trại");
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
        toast.error(error.response?.data.message ?? "Không thể tạo nông trại");
      }
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
    >
      <FarmFields
        control={form.control}
        mode="create"
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
        <Button
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tạo...
            </>
          ) : (
            "Tạo nông trại"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function UpdateFarmBody({
  farm,
  onClose,
}: {
  farm: FarmResType;
  onClose: () => void;
}) {
  const form = useForm<UpdateFarmBodyType>({
    resolver: zodResolver(UpdateFarmBodySchema),
    defaultValues: {
      code: farm.code,
      name: farm.name,
      farmType: "cultivation",
      description: farm.description ?? "",
      address: farm.address ?? "",
      areaSqm: farm.areaSqm ?? undefined,
    },
  });

  useEffect(() => {
    form.reset({
      code: farm.code,
      name: farm.name,
      farmType: "cultivation",
      description: farm.description ?? "",
      address: farm.address ?? "",
      areaSqm: farm.areaSqm ?? undefined,
    });
  }, [farm, form]);

  useClearServerFieldErrors(form);
  const { mutateAsync, isPending } = useOwnerUpdateFarm();

  const handleSubmit = async (data: UpdateFarmBodyType) => {
    try {
      await mutateAsync({ id: farm.id, data });
      toast.success("Đã cập nhật nông trại");
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
          error.response?.data.message ?? "Không thể cập nhật nông trại",
        );
      }
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
    >
      <FarmFields
        control={form.control}
        mode="update"
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
        <Button
          type="submit"
          disabled={isPending}
        >
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

type FarmFieldsControl =
  | {
      control: ReturnType<typeof useForm<CreateFarmBodyType>>["control"];
      mode: "create";
    }
  | {
      control: ReturnType<typeof useForm<UpdateFarmBodyType>>["control"];
      mode: "update";
    };

function FarmFields(props: FarmFieldsControl) {
  // Both schemas share the same field shape; we cast control loosely to share UI.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const control: any = props.control;
  return (
    <FieldGroup>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Controller
          name="code"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="farm-code">Mã nông trại</FieldLabel>
              <Input
                {...field}
                id="farm-code"
                placeholder="Ví dụ: FARM-001"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="farm-name">Tên nông trại</FieldLabel>
              <Input
                {...field}
                id="farm-name"
                placeholder="Ví dụ: Nông trại Thung Lũng Xanh"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name="address"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="farm-address">Địa chỉ</FieldLabel>
            <Input
              {...field}
              id="farm-address"
              placeholder="Ví dụ: 123 Đường Nông Trại, Quận 9"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="areaSqm"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="farm-area-sqm">Diện tích (m²)</FieldLabel>
            <Input
              {...field}
              id="farm-area-sqm"
              type="number"
              step="0.01"
              placeholder="Ví dụ: 105000"
              value={field.value ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === "" ? undefined : Number(val));
              }}
              disabled={props.mode === "update"}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

    </FieldGroup>
  );
}
