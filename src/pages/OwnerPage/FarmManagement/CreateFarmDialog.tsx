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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOwnerCreateFarm } from "@/queries/useOwner";
import {
  CreateFarmBodySchema,
  type CreateFarmBodyType,
} from "@/schemaValidatation/farmManagement";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FARM_TYPES = [
  { value: "cultivation", label: "Cultivation" },
  { value: "livestock", label: "Livestock" },
  { value: "mixed", label: "Mixed" },
] as const;

const CreateFarmDialog = ({ open, onClose }: Props) => {
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

  const { mutateAsync, isPending } = useOwnerCreateFarm();

  const handleClose = () => {
    onClose();
    form.reset();
  };

  const handleSubmit = async (data: CreateFarmBodyType) => {
    try {
      const result = await mutateAsync(data);
      toast.success(result.message);
      handleClose();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          form.setError,
        );
      }
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle>Create Farm</DialogTitle>
            <DialogDescription>
              Fill in the details below to register a new farm.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="code"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="farm-code">Farm Code</FieldLabel>
                    <Input
                      {...field}
                      id="farm-code"
                      placeholder="e.g. FARM-001"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="farm-name">Farm Name</FieldLabel>
                    <Input
                      {...field}
                      id="farm-name"
                      placeholder="e.g. Green Valley Farm"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="farmType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Farm Type</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select farm type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FARM_TYPES.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="farm-address">Address</FieldLabel>
                  <Input
                    {...field}
                    id="farm-address"
                    placeholder="e.g. 123 Farm Road, District 9"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="areaHectares"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="farm-area-hectares">
                      Area (hectares)
                    </FieldLabel>
                    <Input
                      {...field}
                      id="farm-area-hectares"
                      type="number"
                      step="0.01"
                      placeholder="e.g. 10.5"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? undefined : Number(val));
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="areaSqm"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="farm-area-sqm">
                      Area (sq. meters)
                    </FieldLabel>
                    <Input
                      {...field}
                      id="farm-area-sqm"
                      type="number"
                      step="0.01"
                      placeholder="e.g. 105000"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? undefined : Number(val));
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="farm-description">
                    Description
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="farm-description"
                    placeholder="Brief description of the farm"
                    className="min-h-20"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Farm"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFarmDialog;
