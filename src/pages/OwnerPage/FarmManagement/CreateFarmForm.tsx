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
import { useOwnerCreateFarm } from "@/queries/useOwner";
import {
  CreateFarmBodySchema,
  type CreateFarmBodyType,
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
  onBack: () => void;
}

const FARM_TYPES = [{ value: "cultivation", label: "Canh tác" }] as const;

const CreateFarmForm = ({ onBack }: Props) => {
  const [show, setShow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

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

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const handleSubmit = async (data: CreateFarmBodyType) => {
    try {
      const result = await mutateAsync(data);
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
              Quay lại quản lý nông trại
            </Button>
            <Badge className="mb-2 block w-fit">Cổng chủ vườn</Badge>
            <h1 className="text-2xl font-bold">Tạo nông trại</h1>
            <p className="text-muted-foreground">
              Điền thông tin bên dưới để đăng ký nông trại mới.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin nông trại</CardTitle>
            <CardDescription>
              Cung cấp thông tin cơ bản cho nông trại mới.
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
                        <FieldLabel htmlFor="farm-code">
                          Mã nông trại
                        </FieldLabel>
                        <Input
                          {...field}
                          id="farm-code"
                          placeholder="Ví dụ: FARM-001"
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
                        <FieldLabel htmlFor="farm-name">
                          Tên nông trại
                        </FieldLabel>
                        <Input
                          {...field}
                          id="farm-name"
                          placeholder="Ví dụ: Nông trại Thung Lũng Xanh"
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
                      <FieldLabel>Loại nông trại</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại nông trại" />
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
                      <FieldLabel htmlFor="farm-address">Địa chỉ</FieldLabel>
                      <Input
                        {...field}
                        id="farm-address"
                        placeholder="Ví dụ: 123 Đường Nông Trại, Quận 9"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <div>
                  <Controller
                    name="areaSqm"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="farm-area-sqm">
                          Diện tích (m²)
                        </FieldLabel>
                        <Input
                          {...field}
                          id="farm-area-sqm"
                          type="number"
                          step="0.01"
                          placeholder="Ví dụ: 105000"
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
                      <FieldLabel htmlFor="farm-description">Mô tả</FieldLabel>
                      <Textarea
                        {...field}
                        id="farm-description"
                        placeholder="Mô tả ngắn về nông trại"
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
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo nông trại"
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

export default CreateFarmForm;
