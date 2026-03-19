import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useOwnerUpdateFarm } from "@/queries/useOwner";
import {
  UpdateFarmBodySchema,
  type UpdateFarmBodyType,
  type FarmResType,
} from "@/schemaValidatation/farmManagement";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface Props {
  farm: FarmResType;
  onBack: () => void;
}

const FARM_TYPES = [{ value: "cultivation", label: "Cultivation" }] as const;

const UpdateFarmForm = ({ farm, onBack }: Props) => {
  const [show, setShow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const form = useForm<UpdateFarmBodyType>({
    resolver: zodResolver(UpdateFarmBodySchema),
    defaultValues: {
      code: farm.code,
      name: farm.name,
      farmType: farm.farmType,
      description: farm.description ?? "",
      address: farm.address ?? "",
      areaHectares: farm.areaHectares ?? undefined,
      areaSqm: farm.areaSqm ?? undefined,
    },
  });

  const { mutateAsync, isPending } = useOwnerUpdateFarm();

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const handleSubmit = async (data: UpdateFarmBodyType) => {
    try {
      const result = await mutateAsync({ id: farm.id, data });
      toast.success(result.message);
      handleBack();
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
    <div
      ref={containerRef}
      className={`transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={isPending}
              className="mb-2 -ml-2 gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Farm Management
            </Button>
            <Badge className="mb-2 block w-fit">Owner Portal</Badge>
            <h1 className="text-2xl font-bold">Edit Farm</h1>
            <p className="text-muted-foreground">
              Update your farm details below.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Farm Details</CardTitle>
            <CardDescription>
              Modify the information for your farm.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FieldGroup>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                            field.onChange(
                              val === "" ? undefined : Number(val),
                            );
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
                            field.onChange(
                              val === "" ? undefined : Number(val),
                            );
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

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateFarmForm;
