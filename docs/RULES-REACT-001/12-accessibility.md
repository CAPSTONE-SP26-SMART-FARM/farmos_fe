# 13 - Accessibility (a11y)

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Nguyên tắc

Accessibility trong FarmOS tập trung vào **screen reader** và **keyboard navigation** — đây là app B2B quản lý nông nghiệp, không cần WCAG AA đầy đủ nhưng phải dùng được không cần chuột.

---

## Icon-only Button — Bắt buộc có aria-label

Mọi button chỉ có icon (không có text) **phải có `aria-label`**:

```tsx
// ❌ Sai — screen reader đọc "button" không biết làm gì
<Button variant="ghost" size="icon" onClick={handleDelete}>
  <Trash2 />
</Button>

// ✅ Đúng
<Button
  variant="ghost"
  size="icon"
  onClick={handleDelete}
  aria-label="Xóa thiết bị"
>
  <Trash2 />
</Button>

// ✅ Hoặc dùng Tooltip kèm aria-label
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      aria-label="Xóa thiết bị"
      onClick={handleDelete}
    >
      <Trash2 />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Xóa thiết bị</TooltipContent>
</Tooltip>
```

---

## Form Labels — Luôn liên kết với input

shadcn `FormLabel` tự liên kết qua `FormField` → `FormItem` → `FormLabel` pattern — không cần `htmlFor` thủ công khi dùng đúng component:

```tsx
// ✅ Đúng — shadcn FormField tự handle association
<FormField
  control={form.control}
  name="deviceName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Tên thiết bị</FormLabel>  {/* Tự liên kết */}
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// ❌ Sai — label không liên kết với input
<label>Tên thiết bị</label>
<input name="deviceName" />
```

Nếu không dùng shadcn Form pattern:
```tsx
<label htmlFor="device-name">Tên thiết bị</label>
<Input id="device-name" name="deviceName" />
```

---

## Keyboard Navigation

### Dialog / Modal
shadcn `Dialog` tự handle: focus trap, Escape để đóng, focus management khi mở.  
**Không cần** implement thêm — chỉ cần dùng đúng component.

### Dropdown Menu
shadcn `DropdownMenu` tự handle: Arrow keys để navigate, Enter để select, Escape để đóng.

### Table
Khi table có row clickable:
```tsx
<TableRow
  onClick={() => navigate(`/devices/${device.id}`)}
  className="cursor-pointer"
  role="link"  // Screen reader biết đây là link-like
  tabIndex={0}
  onKeyDown={(e) => e.key === "Enter" && navigate(`/devices/${device.id}`)}
>
```

---

## Loading State — Screen Reader

Skeleton không có text → screen reader cần biết đang load:

```tsx
// Thêm aria vào loading container
<div aria-busy={isLoading} aria-label="Đang tải danh sách thiết bị">
  {isLoading ? <TableSkeleton /> : <DeviceTable devices={devices} />}
</div>
```

---

## Status Badge — Không chỉ dùng màu

Màu sắc không đủ cho người mù màu — phải kèm text hoặc icon:

```tsx
// ❌ Sai — chỉ dùng màu
<span className="bg-green-500 rounded-full w-2 h-2" />

// ✅ Đúng — màu + text
<Badge variant="success">
  <Circle className="fill-current" />  {/* Icon nhỏ */}
  Đang hoạt động
</Badge>
```

---

## Image và Icon decorative

```tsx
// Icon decorative (không cần đọc) — thêm aria-hidden
<CheckCircle aria-hidden="true" className="text-green-500" />
<span>Kích hoạt thành công</span>

// Icon có nghĩa (standalone) — phải có title hoặc aria-label
<AlertTriangle aria-label="Cảnh báo: thiết bị sắp hết pin" />
```

---

## Focus Visible

Không xóa outline mặc định của browser — Tailwind có `focus-visible:ring` pattern qua shadcn:

```tsx
// ✅ shadcn Button đã có focus-visible:ring-2 built-in
<Button>Lưu</Button>

// ❌ Sai — xóa outline
<button className="outline-none focus:outline-none">Lưu</button>
```

---

## Checklist nhanh khi review

- [ ] Mọi icon-only button có `aria-label`?
- [ ] Form input có label liên kết?
- [ ] Dialog/Modal dùng shadcn (tự có focus trap)?
- [ ] Error message liên kết với field (`FormMessage` trong RHF)?
- [ ] Clickable table row có `role` và `onKeyDown`?
- [ ] Status không chỉ dùng màu?
- [ ] Icon decorative có `aria-hidden`?

---

## Rules tóm tắt

| Rule | |
|------|-|
| Icon-only button | Bắt buộc `aria-label` |
| Form label | Liên kết qua shadcn FormField hoặc `htmlFor` |
| Dialog/Modal | Dùng shadcn — focus trap tự động |
| Clickable row | `role="link"` + `onKeyDown` Enter |
| Loading | `aria-busy` trên container |
| Status badge | Màu + text (không chỉ màu) |
| Icon decorative | `aria-hidden="true"` |
