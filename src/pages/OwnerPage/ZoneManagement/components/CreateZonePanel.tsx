import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { useOwnerCreateZone } from "@/queries/useZone";
import {
  CreateZoneBodySchema,
  type CreateZoneBodyType,
} from "@/schemaValidatation/zone";
import { useFarmStore } from "@/stores/farmStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  farmCode: string;
  farmId: string;
  onBack: () => void;
}

const ZONE_TYPES = [{ value: "cultivation", label: "Cultivation" }] as const;

const CreateZonePanel = ({ farmCode, farmId, onBack }: Props) => {
  const [show, setShow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const farmAreaSqm = useFarmStore((s) => s.farm?.areaSqm ?? null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const form = useForm<CreateZoneBodyType>({
    resolver: zodResolver(CreateZoneBodySchema),
    defaultValues: {
      farmCode,
      name: "",
      zoneType: "cultivation",
      description: "",
    },
  });

  const { mutateAsync, isPending } = useOwnerCreateZone(farmId);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const handleSubmit = async (data: CreateZoneBodyType) => {
    if (farmAreaSqm && data.areaSqm && data.areaSqm > farmAreaSqm) {
      form.setError("areaSqm", {
        message: `Zone area cannot exceed farm area (${farmAreaSqm.toLocaleString()} sq.m)`,
      });
      return;
    }
    try {
      await mutateAsync(data);
      toast.success("Zone created successfully");
      handleBack();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          form.setError,
        );
      }
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Failed to create zone");
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
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={isPending}
            className="mb-2 -ml-2 gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Zones
          </Button>
          <Badge className="mb-2 block w-fit">Owner Portal</Badge>
          <h1 className="text-2xl font-bold">Create Zone</h1>
          <p className="text-muted-foreground">
            Add a new zone to your farm to organize your crop seasons.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Zone Details</CardTitle>
            <CardDescription>
              Fill in the information for your new zone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="zone-name">Zone Name</FieldLabel>
                      <Input
                        {...field}
                        id="zone-name"
                        placeholder="e.g. North Paddy Field"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="zoneType"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Zone Type</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select zone type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ZONE_TYPES.map((type) => (
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
                  name="areaSqm"
                  control={form.control}
                  render={({ field, fieldState }) => {
                    const exceeds =
                      farmAreaSqm != null &&
                      field.value != null &&
                      field.value > farmAreaSqm;
                    return (
                      <Field data-invalid={fieldState.invalid || exceeds}>
                        <FieldLabel htmlFor="zone-area">
                          Area (sq. meters) — optional
                        </FieldLabel>
                        <Input
                          id="zone-area"
                          type="number"
                          step="0.01"
                          min="0"
                          max={farmAreaSqm ?? undefined}
                          placeholder="e.g. 5000"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "" ? undefined : Number(val),
                            );
                          }}
                        />
                        {farmAreaSqm != null && (
                          <p
                            className={`text-xs ${exceeds ? "text-destructive" : "text-muted-foreground"}`}
                          >
                            {exceeds
                              ? `Exceeds farm area (${farmAreaSqm.toLocaleString()} sq.m)`
                              : `Farm total area: ${farmAreaSqm.toLocaleString()} sq.m`}
                          </p>
                        )}
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    );
                  }}
                />

                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="zone-description">
                        Description — optional
                      </FieldLabel>
                      <Textarea
                        {...field}
                        id="zone-description"
                        placeholder="Brief description of this zone"
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
                      Creating...
                    </>
                  ) : (
                    "Create Zone"
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

export default CreateZonePanel;
