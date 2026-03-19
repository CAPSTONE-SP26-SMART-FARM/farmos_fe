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
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { useOwnerCreateFarmMember } from "@/queries/useOwner";
import {
  CreateFarmMemberBodySchema,
  type CreateFarmMemberBodyType,
} from "@/schemaValidatation/farmMember";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  farmCode: string;
  onBack: () => void;
}

const ROLE_OPTIONS = [
  { value: "manager", label: "Manager" },
  { value: "farmer", label: "Farmer" },
] as const;

const AddMemberPanel = ({ farmCode, onBack }: Props) => {
  const [show, setShow] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const form = useForm<CreateFarmMemberBodyType>({
    resolver: zodResolver(CreateFarmMemberBodySchema),
    defaultValues: {
      farmCode,
      email: "",
      phone: "",
      role: "farmer",
    },
  });

  const { mutateAsync, isPending } = useOwnerCreateFarmMember();

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const handleSubmit = async (data: CreateFarmMemberBodyType) => {
    try {
      const res = await mutateAsync(data);
      setGeneratedPassword(res.data.generatedPassword);
      toast.success("Employee added successfully");
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          form.setError,
        );
      }
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Failed to add employee");
      }
    }
  };

  return (
    <div
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
            Back to Employees
          </Button>
          <Badge className="mb-2 block w-fit">Owner Portal</Badge>
          <h1 className="text-2xl font-bold">Add Employee</h1>
          <p className="text-muted-foreground">
            Create an employee account and assign them to your farm.
          </p>
        </div>

        {generatedPassword ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">
                Employee Created Successfully
              </CardTitle>
              <CardDescription>
                Share these credentials with the employee so they can log in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border bg-muted/50 p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="font-mono text-sm font-medium">
                    {form.getValues("email")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Generated Password
                  </p>
                  <p className="font-mono text-sm font-medium">
                    {generatedPassword}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Role</p>
                  <Badge
                    variant="secondary"
                    className="capitalize"
                  >
                    {form.getValues("role")}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Please save this password. It will not be shown again.
              </p>
              <Button
                onClick={handleBack}
                className="w-full"
              >
                Back to Employee List
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
              <CardDescription>
                Enter the information for the new employee. A password will be
                auto-generated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <FieldGroup>
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="member-email">Email</FieldLabel>
                        <Input
                          {...field}
                          id="member-email"
                          type="email"
                          placeholder="employee@example.com"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="phone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="member-phone">Phone</FieldLabel>
                        <Input
                          {...field}
                          id="member-phone"
                          placeholder="+84 900 000 000"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="role"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Role</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((opt) => (
                              <SelectItem
                                key={opt.value}
                                value={opt.value}
                              >
                                {opt.label}
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
                </FieldGroup>

                <div className="flex gap-3">
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
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Add Employee"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AddMemberPanel;
