import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAsignDoctor } from "@/queries/useAdmin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreateAssignmentBodySchema,
  type CreateAssignmentBodyType,
} from "@/schemaValidatation/doctorAssignment";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type DoctorOption = {
  id: string;
  fullName?: string | null;
  email?: string;
};

type OwnerOption = {
  id: string;
  fullName?: string | null;
  email?: string;
};

const AssignDoctorDialog = () => {
  const [open, setOpen] = useState(false);

  // TODO: thay bằng API list doctor sau (useQuery) rồi map thành {id, fullName, email}
  const doctorOptions: DoctorOption[] = [];
  // TODO: thay bằng API list owner sau (useQuery) rồi map thành {id, fullName, email}
  const ownerOptions: OwnerOption[] = [];

  type CreateAssignmentFormValues = z.input<typeof CreateAssignmentBodySchema>;
  const form = useForm<CreateAssignmentFormValues>({
    resolver: zodResolver(CreateAssignmentBodySchema),
    defaultValues: {
      doctorId: "",
      ownerId: "",
      isPrimary: true,
      notes: "",
    },
  });

  const { mutateAsync, isPending } = useAdminAsignDoctor();

  const reset = () => {
    form.reset({
      doctorId: "",
      ownerId: "",
      isPrimary: true,
      notes: "",
    });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (isPending) return;
    try {
      const body: CreateAssignmentBodyType = {
        doctorId: values.doctorId,
        ownerId: values.ownerId,
        isPrimary: values.isPrimary ?? true,
        notes: values.notes?.trim() ?? "",
      };
      await mutateAsync(body);
      toast.success("Phân công bác sĩ thành công");
      setOpen(false);
      reset();
    } catch {
      toast.error("Phân công bác sĩ thất bại");
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>Phân công bác sĩ</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Phân công bác sĩ cho chủ vườn</DialogTitle>
          <DialogDescription>
            Hiện tại nhập trực tiếp UUID. Sau này bạn sẽ thay bằng danh sách
            chọn bác sĩ/chủ vườn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Controller
              name="doctorId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Bác sĩ</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn bác sĩ" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorOptions.length ? (
                        doctorOptions.map((d) => (
                          <SelectItem
                            key={d.id}
                            value={d.id}
                          >
                            {d.fullName ?? d.email ?? d.id}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem
                          value="__empty__"
                          disabled
                        >
                          Chưa có bác sĩ (kết nối API sau)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="ownerId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Chủ vườn</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn chủ vườn" />
                    </SelectTrigger>
                    <SelectContent>
                      {ownerOptions.length ? (
                        ownerOptions.map((o) => (
                          <SelectItem
                            key={o.id}
                            value={o.id}
                          >
                            {o.fullName ?? o.email ?? o.id}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem
                          value="__empty_owner__"
                          disabled
                        >
                          Chưa có chủ vườn (kết nối API sau)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="isPrimary"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="horizontal"
                >
                  <FieldLabel htmlFor="assign-primary">
                    Phân công chính
                  </FieldLabel>
                  <input
                    id="assign-primary"
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4"
                    aria-label="Phân công chính"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Ghi chú</FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    rows={4}
                    placeholder="Không bắt buộc"
                  />
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
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang phân công...
                </>
              ) : (
                "Phân công"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDoctorDialog;
