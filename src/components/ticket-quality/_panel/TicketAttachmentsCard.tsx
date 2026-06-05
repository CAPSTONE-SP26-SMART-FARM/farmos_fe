import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AttachmentGallery } from "@/components/common/AttachmentGallery";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";
import { Image as ImageIcon } from "lucide-react";

interface TicketAttachmentsCardProps {
  attachments: TicketIncidentResType["attachments"];
}

export function TicketAttachmentsCard({
  attachments,
}: TicketAttachmentsCardProps) {
  if (attachments.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Hình ảnh đính kèm
          <span className="text-muted-foreground text-sm font-normal">
            ({attachments.length})
          </span>
        </CardTitle>
        <CardDescription>
          Bấm vào ảnh để xem kích thước lớn.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AttachmentGallery attachments={attachments} />
      </CardContent>
    </Card>
  );
}
