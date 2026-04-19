import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

import { DoctorTypeName } from "@/constants/profile";
import { useDoctorUpsertProfile } from "@/queries/useDoctor";
import {
  UpsertDoctorProfileBodySchema,
  type UpsertDoctorProfileBodyType,
} from "@/schemaValidatation/doctorProfile";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { toast } from "sonner";

const UpsertProfile = () => {
  const form = useForm<UpsertDoctorProfileBodyType>({
    resolver: zodResolver(UpsertDoctorProfileBodySchema),
    defaultValues: {
      bio: "",
      licenseExpiryDate: "",
      doctorType: DoctorTypeName.Partner,
      licenseNumber: "",
      specialization: "",
      yearsOfExperience: 0,
    },
  });

  useClearServerFieldErrors(form);
  const { mutateAsync, isPending } = useDoctorUpsertProfile();

  const handleSubmit = async (data: UpsertDoctorProfileBodyType) => {
    try {
      const result = await mutateAsync(data);
      toast.success(result.message);
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
        toast.error(error.response?.data.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-start bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Cập nhật hồ sơ FarmOS
          </CardTitle>
          <CardDescription className="text-center">
            Cập nhật thông tin hồ sơ bác sĩ
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-3">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  name="specialization"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="form-rhf-demo-description">
                        Chuyên khoa
                      </FieldLabel>
                      <Input
                        {...field}
                        id="form-rhf-demo-description"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="yearsOfExperience"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="form-rhf-demo-description">
                        Số năm kinh nghiệm
                      </FieldLabel>
                      <Input
                        {...field}
                        id="form-rhf-demo-description"
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                        }}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  name="licenseNumber"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="form-rhf-demo-description">
                        Số giấy phép
                      </FieldLabel>
                      <Input
                        {...field}
                        id="form-rhf-demo-description"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="licenseExpiryDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="form-rhf-demo-description">
                        Ngày hết hạn giấy phép
                      </FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            data-empty={field.value}
                            className="w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Chọn ngày</span>
                            )}
                            <ChevronDownIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0"
                          align="start"
                        >
                          <Calendar
                            {...field}
                            mode="single"
                            selected={new Date()}
                            onSelect={(e) => {
                              field.onChange(format(e!, "yyyy-MM-dd"));
                            }}
                            defaultMonth={new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="bio"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-description">
                      Giới thiệu
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="form-rhf-textarea-about"
                      aria-invalid={fieldState.invalid}
                      placeholder="Giới thiệu ngắn về chuyên môn của bạn"
                      className="min-h-[120px]"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Cập nhật"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default UpsertProfile;
