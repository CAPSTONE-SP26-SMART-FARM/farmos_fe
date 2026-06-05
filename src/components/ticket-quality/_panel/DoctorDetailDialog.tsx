import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import DoctorPublicProfile from "../DoctorPublicProfile";

interface DoctorDetailDialogProps {
  doctorId: string | null;
  /** Tên đầy đủ (nếu có sẵn từ assignee/creator). BroadcastTimeline không
   * có name → truyền `null`, dialog hiển thị fallback "Bác sĩ". */
  doctorName?: string | null;
  doctorEmail?: string | null;
  avatarUrl?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog xem thông tin bác sĩ (BE: `GET /doctors/:id/public`). Trả về:
 * chuyên môn, đánh giá trung bình, số ticket đã xử lý. KHÔNG có tier
 * (BR-81). Lazy fetch — chỉ gọi API khi dialog mở.
 */
export function DoctorDetailDialog({
  doctorId,
  doctorName,
  doctorEmail,
  avatarUrl,
  open,
  onOpenChange,
}: DoctorDetailDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">Thông tin bác sĩ</DialogTitle>
        <DialogDescription className="sr-only">
          Chi tiết bác sĩ — chuyên môn, đánh giá và số ticket đã xử lý.
        </DialogDescription>
        {open && doctorId && (
          <DoctorPublicProfile
            doctorId={doctorId}
            doctorName={doctorName}
            doctorEmail={doctorEmail}
            avatarUrl={avatarUrl}
            layout="card"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
