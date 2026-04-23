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
import useDebounce from "@/hooks/useDebounce";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
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
    },
  });

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
    form.reset({ iotDeviceId, ownerId: "" });
    setSearch("");
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (isPending) return;
    try {
      await mutateAsync(values);
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
