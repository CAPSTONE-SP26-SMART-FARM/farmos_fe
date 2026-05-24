---
name: add-form
description: Tạo form mới với React Hook Form + Zod, dùng shadcn Form components, handle 422 BE error, reset đúng khi dialog đóng. Trigger khi user nói "tạo form X", "add form create/edit Y", "form validate Z".
---

# Skill — Add Form (RHF + Zod)

> Đọc trước: [../../rules/06-form-pattern.md](../../rules/06-form-pattern.md).

## When to use

- Form mới (Create/Edit dialog, full page, inline edit).
- Refactor form cũ không theo RHF + Zod.

## Steps

### 1. Schema — `src/schemaValidatation/[entity].ts`

```ts
import { z } from "zod";

export const createDoctorWithdrawalSchema = z.object({
  amount: z.coerce.number().min(1000, "Tối thiểu 1.000đ"),
  bankAccountId: z.string().min(1, "Chọn tài khoản"),
  note: z.string().max(500).optional(),
});

export type CreateDoctorWithdrawalInput = z.infer<typeof createDoctorWithdrawalSchema>;
```

- Zod v4: dùng `.min(1)` thay `.nonempty()`.
- Dùng `z.coerce.number()` cho input numeric (input HTML trả string).

### 2. Form component — `[Entity]Form.tsx`

```tsx
const form = useForm<CreateDoctorWithdrawalInput>({
  resolver: zodResolver(createDoctorWithdrawalSchema),
  defaultValues: { amount: 0, bankAccountId: "", note: "" },
});
```

- Dùng `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>` từ `@/components/ui/form`.
- Submit handler: `form.handleSubmit(onSubmit)`.

### 3. Reset khi dialog đóng

```tsx
useEffect(() => {
  if (!open) form.reset();
}, [open, form]);
```

Edit form: `form.reset(initialData)` khi `initialData` thay đổi (dùng `useEffect`).

### 4. Handle 422 từ BE

BE trả `{ statusCode: 422, errors: [{ path: "amount", message: "..." }] }`.

```tsx
onError: (error) => {
  if (error.response?.status === 422) {
    error.response.data.errors.forEach((e) => {
      form.setError(e.path as any, { message: e.message });
    });
    return;
  }
  toast.error(getErrorMessage(error));
}
```

### 5. Submit + mutation

Trong Page/Dialog component:
```tsx
const { mutate, isPending } = useCreateDoctorWithdrawal();

const onSubmit = (data: CreateDoctorWithdrawalInput) => {
  mutate(data, {
    onSuccess: () => {
      toast.success("Tạo yêu cầu rút tiền thành công");
      setOpen(false);
    },
  });
};
```

Button submit: `disabled={isPending}`, hiện `<Loader2 className="animate-spin" />` khi pending.

## Verify

- [ ] Schema dùng Zod v4 syntax (không có `.nonempty()`).
- [ ] Form reset khi dialog mở/đóng (Create) hoặc khi `initialData` đổi (Edit).
- [ ] 422 error map vào field cụ thể qua `form.setError`.
- [ ] Submit button disable khi pending.
- [ ] Error message tiếng Việt.
- [ ] Không dùng `<input>` raw — luôn `<Input>` từ shadcn.

## Anti-patterns

- ❌ `useState` cho từng field thay vì RHF.
- ❌ Validate thủ công trong `onSubmit` thay vì Zod schema.
- ❌ Toast 422 chung chung — phải map vào field.
- ❌ Reset form bằng cách unmount/remount dialog → mất animation.
