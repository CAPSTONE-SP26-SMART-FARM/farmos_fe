import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ImageOff,
  X,
} from "lucide-react";
import type { DailyLogAttachmentType } from "@/schemaValidatation/dailyLog";

function isImage(att: DailyLogAttachmentType): boolean {
  if (att.mimeType) return att.mimeType.startsWith("image/");
  // Fallback theo đuôi file khi BE không trả mimeType
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(att.fileName ?? att.url);
}

function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachments: DailyLogAttachmentType[];
  title?: string;
}

export function DailyLogAttachmentsDialog({
  open,
  onOpenChange,
  attachments,
  title = "Hình ảnh nhật ký",
}: Props) {
  // Ảnh đang phóng to (index trong mảng images); null = đang xem dạng lưới
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  const images = attachments.filter(isImage);
  const files = attachments.filter((a) => !isImage(a));

  const handleOpenChange = (next: boolean) => {
    if (!next) setZoomIndex(null);
    onOpenChange(next);
  };

  const showPrev = () =>
    setZoomIndex((i) =>
      i === null ? null : (i - 1 + images.length) % images.length,
    );
  const showNext = () =>
    setZoomIndex((i) => (i === null ? null : (i + 1) % images.length));

  const zoomed = zoomIndex !== null ? images[zoomIndex] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {attachments.length} tệp đính kèm trong nhật ký này.
          </DialogDescription>
        </DialogHeader>

        {/* Ảnh phóng to */}
        {zoomed ? (
          <div className="space-y-3">
            <div className="relative flex items-center justify-center rounded-md bg-muted/40">
              <img
                src={zoomed.url}
                alt={zoomed.fileName ?? "Hình ảnh nhật ký"}
                className="max-h-[60vh] w-auto rounded-md object-contain"
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={showPrev}
                    aria-label="Ảnh trước"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={showNext}
                    aria-label="Ảnh sau"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground truncate">
                {zoomed.fileName ?? "Hình ảnh"}
                {images.length > 1 && (
                  <span className="ml-2">
                    ({(zoomIndex ?? 0) + 1}/{images.length})
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={zoomed.url} download target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4 mr-1" />
                    Tải về
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomIndex(null)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Đóng ảnh
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            {attachments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <ImageOff className="h-8 w-8" />
                <span className="text-sm">Nhật ký này chưa có hình ảnh.</span>
              </div>
            ) : (
              <>
                {/* Lưới ảnh */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setZoomIndex(idx)}
                        className={cn(
                          "group relative aspect-square overflow-hidden rounded-md border",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        )}
                        aria-label={`Xem ảnh ${img.fileName ?? idx + 1}`}
                      >
                        <img
                          src={img.url}
                          alt={img.fileName ?? `Hình ảnh ${idx + 1}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Tệp không phải ảnh */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-md border p-2 hover:bg-muted/50"
                      >
                        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-sm">
                          {file.fileName ?? "Tệp đính kèm"}
                        </span>
                        {formatSize(file.sizeBytes) && (
                          <span className="text-xs text-muted-foreground">
                            {formatSize(file.sizeBytes)}
                          </span>
                        )}
                        <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
