import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { DailyLogAttachmentsDialog } from "@/components/common/DailyLogAttachmentsDialog";
import type { DailyLogAttachmentType } from "@/schemaValidatation/dailyLog";

function isImage(att: DailyLogAttachmentType): boolean {
  if (att.mimeType) return att.mimeType.startsWith("image/");
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(att.fileName ?? att.url);
}

interface Props {
  attachments: DailyLogAttachmentType[];
  /** Tên người ghi, để tiêu đề dialog rõ hơn */
  authorName?: string;
}

/**
 * Cell hiển thị ảnh đính kèm của một dòng nhật ký: thumbnail ảnh đầu + số lượng,
 * bấm vào mở dialog xem tất cả. Tự quản lý state dialog nên panel chỉ cần render cell.
 */
export function DailyLogAttachmentsCell({ attachments, authorName }: Props) {
  const [open, setOpen] = useState(false);

  if (!attachments || attachments.length === 0) {
    return <span className="text-muted-foreground italic">—</span>;
  }

  const firstImage = attachments.find(isImage);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 rounded-md p-1 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={`Xem ${attachments.length} ảnh đính kèm`}
      >
        {firstImage ? (
          <span className="relative h-10 w-10 overflow-hidden rounded-md border">
            <img
              src={firstImage.url}
              alt="Ảnh nhật ký"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </span>
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </span>
        )}
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
          {attachments.length} ảnh
        </span>
      </button>

      <DailyLogAttachmentsDialog
        open={open}
        onOpenChange={setOpen}
        attachments={attachments}
        title={authorName ? `Hình ảnh — ${authorName}` : "Hình ảnh nhật ký"}
      />
    </>
  );
}
