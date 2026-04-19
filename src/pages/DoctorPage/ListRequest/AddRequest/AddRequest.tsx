import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { useDoctorRequest } from "@/queries/useDoctor";
import {
  SubmitDoctorRequestBodySchema,
  type SubmitDoctorRequestBodyType,
} from "@/schemaValidatation/doctorProfile";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const AddRequest = () => {
  const form = useForm<SubmitDoctorRequestBodyType>({
    resolver: zodResolver(SubmitDoctorRequestBodySchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });
  useClearServerFieldErrors(form);

  const { mutateAsync: request, isPending } = useDoctorRequest();
  const onSubmit = form.handleSubmit(
    async (data: SubmitDoctorRequestBodyType) => {
      try {
        await request(data);
        reset();
      } catch (error) {
        if (
          isApiErrorUnprocessableEntityResponse<SubmitDoctorRequestBodyType>(
            error,
          )
        ) {
          handleApiErrorUnprocessentity<SubmitDoctorRequestBodyType>(
            error.response!.data.errors,
            form.setError,
            { getValues: form.getValues },
          );
          return;
        }

        if (isApiErrorResponse(error)) {
          toast.error(error.response?.data.message || "Không thể gửi yêu cầu.");
          return;
        }

        toast.error("Không thể gửi yêu cầu.");
      }
    },
  );

  const reset = () => {
    form.reset();
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) {
          reset();
        }
      }}
    >
      <form onSubmit={onSubmit}>
        <DialogTrigger asChild>
          <Button variant="outline">Request</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update more about reason</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">Title</FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="hoangday185"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-description">
                    Description
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="form-rhf-textarea-about"
                    aria-invalid={fieldState.invalid}
                    placeholder=""
                    className="min-h-30"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default AddRequest;
