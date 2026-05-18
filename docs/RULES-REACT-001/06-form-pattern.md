# 07 - Form Pattern

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Stack form

- **React Hook Form 7.71.2** + **@hookform/resolvers 5.2.2** + **Zod 4.3.6**
- Tất cả form trong project đều dùng RHF — không dùng controlled state thủ công (`useState` cho từng field)
- Zod schema là source of truth cho validation và TypeScript type

---

## Cấu trúc cơ bản

```tsx
// _components/DeviceForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createDeviceSchema, type CreateDeviceBodyType } from "@/schemaValidatation/device";

interface Props {
  defaultValues?: Partial<CreateDeviceBodyType>;
  onSubmit: (values: CreateDeviceBodyType) => void;
  isSubmitting?: boolean;
}

export function DeviceForm({ defaultValues, onSubmit, isSubmitting }: Props) {
  const form = useForm<CreateDeviceBodyType>({
    resolver: zodResolver(createDeviceSchema),
    defaultValues: {
      name: "",
      deviceType: undefined,
      zoneId: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên thiết bị</FormLabel>
              <FormControl>
                <Input placeholder="Nhập tên thiết bị..." {...field} />
              </FormControl>
              <FormMessage />  {/* Tự hiển thị error từ Zod */}
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang lưu..." : "Lưu"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Form trong Dialog — Reset khi đóng

**Bắt buộc reset form khi dialog đóng** — tránh data cũ còn sót khi mở lại.

```tsx
// _components/CreateDeviceDialog.tsx
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateDevice } from "@/queries/useDevice";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDeviceDialog({ open, onOpenChange }: Props) {
  const { mutate: createDevice, isPending } = useCreateDevice();

  const handleSubmit = (values: CreateDeviceBodyType) => {
    createDevice(values, {
      onSuccess: () => onOpenChange(false),  // Đóng dialog sau khi thành công
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm thiết bị IoT</DialogTitle>
        </DialogHeader>
        <DeviceForm
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          // key={open ? "open" : "closed"} — dùng key trick để reset form tự động
          key={String(open)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

**Cách reset form:**
- **`key={String(open)}`** — đơn giản nhất, unmount/remount form khi open thay đổi
- **`form.reset()`** trong `useEffect` — dùng khi cần control timing
- Không dùng `useEffect` để watch từng field reset thủ công

---

## Form Edit — Load default values từ API

```tsx
// _components/EditDeviceDialog.tsx
export function EditDeviceDialog({ deviceId, open, onOpenChange }: Props) {
  const { data, isLoading } = useDeviceDetail(deviceId);
  const { mutate: updateDevice, isPending } = useUpdateDevice(deviceId);

  const handleSubmit = (values: UpdateDeviceBodyType) => {
    updateDevice(values, {
      onSuccess: () => onOpenChange(false),
    });
  };

  if (isLoading) return <DialogContent><LoadingCard /></DialogContent>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Chỉnh sửa thiết bị</DialogTitle>
        <DeviceForm
          // Truyền data từ API làm defaultValues
          defaultValues={{
            name: data?.data.name,
            deviceType: data?.data.deviceType,
            zoneId: data?.data.zoneId,
          }}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          key={deviceId}  // Reset form khi deviceId thay đổi
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

## Xử lý lỗi 422 từ API (field-level validation)

Khi API trả về lỗi validation (422 Unprocessable Entity), dùng `handleApiErrorUnprocessentity` từ `@/lib/axios` để map lỗi vào đúng field của RHF:

```tsx
// Trong query hook
export const useCreateDevice = () => {
  return useMutation({
    mutationFn: deviceService.create,
    onError: (error, _vars, _ctx, form?) => {
      // handleApiErrorUnprocessentity nhận error + form.setError để map lỗi vào field
      handleApiErrorUnprocessentity(error, form?.setError);
    },
  });
};

// Hoặc truyền form.setError từ component
const { mutate } = useCreateDevice();
const handleSubmit = (values) => {
  mutate(values, {
    onError: (error) => handleApiErrorUnprocessentity(error, form.setError),
  });
};
```

---

## Multi-step Form (Wizard)

Khi form có >= 3 bước tách biệt → dùng page riêng thay vì dialog.

```tsx
// Pattern: local state quản lý step, 1 useForm dùng xuyên suốt
const [step, setStep] = useState<1 | 2 | 3>(1);
const form = useForm<FullFormType>({ resolver: zodResolver(fullSchema) });

// Validate từng step trước khi next
const handleNextStep = async () => {
  const stepFields: Record<number, (keyof FullFormType)[]> = {
    1: ["name", "deviceType"],
    2: ["zoneId", "installDate"],
  };
  const valid = await form.trigger(stepFields[step]);
  if (valid) setStep((s) => (s + 1) as typeof step);
};
```

---

## Rules tóm tắt

| Rule | Mô tả |
|------|-------|
| Luôn dùng RHF | Không useState cho form fields |
| Zod là source of truth | Schema → Type → Validation |
| Reset khi dialog đóng | Dùng `key={String(open)}` |
| Error 422 → `setError` | Map lỗi API vào đúng field |
| Form dùng chung | `DeviceForm` dùng cả Create lẫn Edit, nhận `defaultValues` |
| Multi-step >= 3 bước | Dùng page riêng, không dùng dialog |
| `isSubmitting` → disable button | Tránh double submit |
