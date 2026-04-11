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
import { useOwnerUpdateZone } from "@/queries/useZone";
import {
  UpdateZoneBodySchema,
  type UpdateZoneBodyType,
  type ZoneType,
} from "@/schemaValidatation/zone";
import { useFarmStore } from "@/stores/farmStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  zone: ZoneType;
  farmId: string;
  onBack: () => void;
}

const ZONE_TYPES = [{ value: "cultivation", label: "Canh tác" }] as const;

const EditZonePanel = ({ zone, farmId, onBack }: Props) => {
  const [show, setShow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const farmAreaSqm = useFarmStore((s) => s.farm?.areaSqm ?? null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const form = useForm<UpdateZoneBodyType>({
    resolver: zodResolver(UpdateZoneBodySchema),
    defaultValues: {
      name: zone.name,
      zoneType: zone.zoneType,
      description: zone.description ?? "",
      areaSqm: zone.areaSqm ?? undefined,
    },
  });

  const { mutateAsync, isPending } = useOwnerUpdateZone(zone.id, farmId);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const handleSubmit = async (data: UpdateZoneBodyType) => {
    if (farmAreaSqm && data.areaSqm && data.areaSqm > farmAreaSqm) {
      form.setError("areaSqm", {
        message: `Diện tích khu vực không được vượt quá diện tích nông trại (${farmAreaSqm.toLocaleString()} m²)`,
      });
      return;
    }
    try {
      await mutateAsync(data);
      toast.success("Cập nhật khu vực thành công");
      handleBack();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          form.setError,
        );
      }
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Không thể cập nhật khu vực");
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
            Quay lại danh sách khu vực
          </Button>
          <Badge className="mb-2 block w-fit">Cổng chủ vườn</Badge>
          <h1 className="text-2xl font-bold">Chỉnh sửa khu vực</h1>
          <p className="text-muted-foreground">
            Cập nhật thông tin của{" "}
            <span className="font-medium">{zone.name}</span>.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin khu vực</CardTitle>
            <CardDescription>
              Chỉnh sửa thông tin cho khu vực này.
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
                      <FieldLabel htmlFor="zone-name">Tên khu vực</FieldLabel>
                      <Input
                        {...field}
                        id="zone-name"
                        placeholder="Ví dụ: Khu ruộng phía Bắc"
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
                      <FieldLabel>Loại khu vực</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại khu vực" />
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
                          Diện tích (m²) — tùy chọn
                        </FieldLabel>
                        <Input
                          id="zone-area"
                          type="number"
                          step="0.01"
                          min="0"
                          max={farmAreaSqm ?? undefined}
                          placeholder="Ví dụ: 5000"
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
                              ? `Vượt quá diện tích nông trại (${farmAreaSqm.toLocaleString()} m²)`
                              : `Tổng diện tích nông trại: ${farmAreaSqm.toLocaleString()} m²`}
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
                        Mô tả — tùy chọn
                      </FieldLabel>
                      <Textarea
                        {...field}
                        id="zone-description"
                        placeholder="Mô tả ngắn về khu vực này"
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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditZonePanel;
