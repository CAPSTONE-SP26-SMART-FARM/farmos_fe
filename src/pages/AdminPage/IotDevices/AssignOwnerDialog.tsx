import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
import {
  AdminAssignOwnerBodySchema,
  type AdminAssignOwnerBodyType,
} from "@/schemaValidatation/iotDevice";
import { RoleName } from "@/constants/role";
import { useAdminListUsers } from "@/queries/useAdmin";
import { useAdminAssignIotOwner } from "@/queries/useIotDevice";
import { useIotKitAvailableSlots } from "@/queries/useIotKit";
import useDebounce from "@/hooks/useDebounce";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, PackageSearch, Search, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface AssignOwnerDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  iotDeviceId: string;
  deviceName: string;
}

export default function AssignOwnerDialog({
  open,
  onOpenChange,
  iotDeviceId,
  deviceName,
}: AssignOwnerDialogProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const form = useForm<AdminAssignOwnerBodyType>({
    resolver: zodResolver(AdminAssignOwnerBodySchema),
    defaultValues: {
      iotDeviceId,
      ownerId: "",
      iotKitOrderId: undefined,
    },
  });
  const selectedOwnerId = form.watch("ownerId");
  const slotsQuery = useIotKitAvailableSlots(
    selectedOwnerId,
    !!selectedOwnerId,
  );
  const slots = slotsQuery.data?.data?.data ?? [];

  // Clear stale `iotKitOrderId` when admin picks a different owner — the
  // previously selected order belongs to the previous owner and would be
  // rejected by BE.
  const prevOwnerIdRef = useRef(selectedOwnerId);
  useEffect(() => {
    if (prevOwnerIdRef.current !== selectedOwnerId) {
      prevOwnerIdRef.current = selectedOwnerId;
      form.setValue("iotKitOrderId", undefined, { shouldDirty: false });
    }
  }, [selectedOwnerId, form]);

  const ownersQuery = useAdminListUsers({
    role: RoleName.Owner,
    page: 1,
    limit: 50,
  });

  const owners = ownersQuery.data?.data?.data ?? [];

  const filteredOwners = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    if (!needle) return owners;
    return owners.filter((o) => {
      const hay = `${o.fullName ?? ""} ${o.email ?? ""} ${o.phone ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [owners, debouncedSearch]);

  const { mutateAsync, isPending } = useAdminAssignIotOwner();

  const reset = () => {
    form.reset({ iotDeviceId, ownerId: "", iotKitOrderId: undefined });
    setSearch("");
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (isPending) return;
    // Strip empty optional iotKitOrderId so BE strict body parse passes.
    const body: AdminAssignOwnerBodyType = values.iotKitOrderId
      ? values
      : { iotDeviceId: values.iotDeviceId, ownerId: values.ownerId };
    try {
      await mutateAsync(body);
      toast.success("Gán owner cho thiết bị thành công");
      onOpenChange(false);
      reset();
    } catch {
      // error toast handled by onMutationError in the hook
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gán owner cho thiết bị</DialogTitle>
          <DialogDescription>
            Chọn chủ vườn sẽ nhận thiết bị{" "}
            <span className="font-medium text-foreground">{deviceName}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Tìm chủ vườn</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên, email, số điện thoại"
                  className="pl-9"
                />
              </div>
            </Field>

            <Controller
              name="ownerId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Chủ vườn</FieldLabel>
                  <div className="max-h-64 overflow-y-auto rounded-md border">
                    {ownersQuery.isLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredOwners.length === 0 ? (
                      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                        Không có chủ vườn phù hợp.
                      </p>
                    ) : (
                      <ul className="divide-y">
                        {filteredOwners.map((o) => {
                          const selected = field.value === o.id;
                          return (
                            <li key={o.id}>
                              <button
                                type="button"
                                onClick={() => field.onChange(o.id)}
                                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-muted ${selected ? "bg-primary/10" : ""}`}
                              >
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                  {o.avatarUrl ? (
                                    <img
                                      src={o.avatarUrl}
                                      alt={o.fullName}
                                      className="h-8 w-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <User className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col">
                                  <span className="truncate text-sm font-medium">
                                    {o.fullName || o.email}
                                  </span>
                                  <span className="truncate text-xs text-muted-foreground">
                                    {o.email}
                                    {o.phone ? ` · ${o.phone}` : ""}
                                  </span>
                                </span>
                                {selected && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="iotKitOrderId"
              control={form.control}
              render={({ field, fieldState }) => {
                if (!selectedOwnerId) return <></>;
                if (slotsQuery.isLoading) {
                  return (
                    <Field>
                      <FieldLabel>Liên kết với đơn Bộ Kit IoT</FieldLabel>
                      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải đơn còn slot trống...
                      </div>
                    </Field>
                  );
                }
                if (slots.length === 0) {
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>
                        Liên kết với đơn Bộ Kit IoT (tuỳ chọn)
                      </FieldLabel>
                      <Input
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                        placeholder="Mã đơn (UUID) — để trống nếu không gắn"
                        aria-invalid={fieldState.invalid}
                      />
                      <p className="text-xs text-muted-foreground">
                        Owner này hiện không có đơn còn slot trống, hoặc tính
                        năng tự động chưa khả dụng. Bạn có thể nhập UUID đơn
                        thủ công.
                      </p>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  );
                }
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Liên kết với đơn Bộ Kit IoT (tuỳ chọn)
                    </FieldLabel>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => field.onChange(undefined)}
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition hover:bg-muted ${!field.value ? "border-primary bg-primary/10" : ""}`}
                      >
                        <span>Không liên kết với đơn nào</span>
                        {!field.value && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                      {slots.map((slot) => {
                        const selected = field.value === slot.orderId;
                        const disabled = slot.remainingSlots <= 0;
                        return (
                          <button
                            key={slot.orderId}
                            type="button"
                            disabled={disabled}
                            onClick={() => field.onChange(slot.orderId)}
                            className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${disabled ? "cursor-not-allowed opacity-50" : "hover:bg-muted"} ${selected ? "border-primary bg-primary/10" : ""}`}
                          >
                            <PackageSearch className="h-4 w-4 text-muted-foreground" />
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate font-medium">
                                {slot.kitName} · {slot.orderNumber}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {slot.remainingSlots}/{slot.totalSlots} slot
                                trống
                              </span>
                            </span>
                            {selected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                );
              }}
            />
          </FieldGroup>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
              >
                Hủy
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending || !form.watch("ownerId")}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gán...
                </>
              ) : (
                "Gán owner"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
