# 09 - Dialog Pattern

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Dialog vs AlertDialog vs Sheet

| Component | Dùng khi | Ví dụ |
|-----------|----------|-------|
| `Dialog` | Form tạo/sửa, xem detail nhỏ | Create device, edit profile |
| `AlertDialog` | Xác nhận action nguy hiểm (không thể hoàn tác) | Xóa record, hủy mùa vụ |
| `Sheet` | Form dài hơn, filter panel, detail panel bên cạnh | Edit có nhiều field, filter sidebar |

---

## Dialog — Form Create

```tsx
// _components/CreateDeviceDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDeviceDialog({ open, onOpenChange }: Props) {
  const { mutate, isPending } = useCreateDevice();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm thiết bị IoT</DialogTitle>
          <DialogDescription>
            Điền thông tin thiết bị cần thêm vào hệ thống.
          </DialogDescription>
        </DialogHeader>
        <DeviceForm
          key={String(open)}          {/* Reset form khi dialog đóng/mở */}
          isSubmitting={isPending}
          onSubmit={(values) =>
            mutate(values, { onSuccess: () => onOpenChange(false) })
          }
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

## AlertDialog — Confirm Delete

**Luôn dùng `AlertDialog` cho action xóa / hủy** — không dùng `window.confirm`, không dùng Dialog thông thường.

```tsx
// _components/DeleteDeviceAlert.tsx
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  deviceId: string;
  deviceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteDeviceAlert({ deviceId, deviceName, open, onOpenChange }: Props) {
  const { mutate: deleteDevice, isPending } = useDeleteDevice();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa thiết bị?</AlertDialogTitle>
          <AlertDialogDescription>
            Thiết bị <strong>{deviceName}</strong> sẽ bị xóa vĩnh viễn.
            Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={() => deleteDevice(deviceId, { onSuccess: () => onOpenChange(false) })}
          >
            {isPending ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## Row Actions — Pattern chuẩn

Mọi table row actions dùng `DropdownMenu` từ shadcn — không dùng button inline trong cell.

```tsx
// _components/DeviceRowActions.tsx
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PencilLine, Trash2, Eye } from "lucide-react";

interface Props {
  device: Device;
}

export function DeviceRowActions({ device }: Props) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate(`/dashboard/owner/iot-devices/${device.id}`)}>
            <Eye /> Xem chi tiết
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenEdit(true)}>
            <PencilLine /> Chỉnh sửa
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setOpenDelete(true)}
          >
            <Trash2 /> Xóa thiết bị
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditDeviceDialog
        deviceId={device.id}
        open={openEdit}
        onOpenChange={setOpenEdit}
      />
      <DeleteDeviceAlert
        deviceId={device.id}
        deviceName={device.name}
        open={openDelete}
        onOpenChange={setOpenDelete}
      />
    </>
  );
}
```

---

## Sheet — Form / Panel dài hơn

Dùng `Sheet` khi form có nhiều field hơn dialog cho phép, hoặc cần hiện detail bên cạnh list:

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function DeviceDetailSheet({ deviceId, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Chi tiết thiết bị</SheetTitle>
        </SheetHeader>
        <DeviceDetailContent deviceId={deviceId} />
      </SheetContent>
    </Sheet>
  );
}
```

---

## Kích thước Dialog

| Nội dung | className |
|----------|-----------|
| Form ngắn (< 5 fields) | `sm:max-w-[425px]` |
| Form trung bình (5-8 fields) | `sm:max-w-[500px]` |
| Form dài hoặc có preview | `sm:max-w-[700px]` |
| Nếu vượt 700px | Dùng `Sheet` thay thế |

---

## Rules tóm tắt

| Rule | |
|------|-|
| Xóa/hủy action | Luôn dùng `AlertDialog` |
| Form create/edit | `Dialog` với `key={String(open)}` để reset |
| Row actions | `DropdownMenu` với `MoreHorizontal` icon |
| Dialog state | Giữ `open` state ở component cha, không ở trong row |
| Form dài | Chuyển sang `Sheet` hoặc page riêng |
| Confirm text | Mô tả rõ hậu quả — "không thể hoàn tác" |
| Button xóa | `bg-destructive` variant, text tiếng Việt |
