import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface AttachmentItem {
  id: string;
  url: string;
  createdAt?: string;
}

interface AttachmentGalleryProps {
  attachments: AttachmentItem[];
  className?: string;
}

// Thumbnail item — handle loading skeleton + error fallback inline.
function Thumbnail({
  attachment,
  index,
  onOpen,
}: {
  attachment: AttachmentItem;
  index: number;
  onOpen: (i: number) => void;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className="group relative aspect-square overflow-hidden rounded-md border bg-muted transition hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Xem ảnh ${index + 1}`}
    >
      {status === "loading" && (
        <Skeleton className="absolute inset-0 h-full w-full" />
      )}
      {status === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
          <ImageOff className="h-5 w-5" />
          <span className="text-[10px]">Không tải được</span>
        </div>
      ) : (
        <img
          src={attachment.url}
          alt={`Ảnh đính kèm ${index + 1}`}
          loading="lazy"
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
          className={cn(
            "h-full w-full object-cover transition-opacity",
            status === "ready" ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </button>
  );
}

// Inner image component — keyed by attachment id ở caller, mỗi lần đổi
// currentIndex thì remount, status auto-reset về "loading". Tránh
// pattern setState-in-effect.
function LightboxImage({ attachment }: { attachment: AttachmentItem }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-2 text-white">
        <ImageOff className="h-10 w-10" />
        <p className="text-sm">Không tải được ảnh</p>
      </div>
    );
  }

  return (
    <>
      {status === "loading" && <Skeleton className="absolute h-3/4 w-3/4" />}
      <img
        src={attachment.url}
        alt="Ảnh đính kèm"
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
        className={cn(
          "max-h-[78vh] max-w-full object-contain transition-opacity",
          status === "ready" ? "opacity-100" : "opacity-0",
        )}
      />
    </>
  );
}

// Lightbox content — kept in its own component so hooks (keydown listener)
// only mount while the dialog is actually open.
function Lightbox({
  attachments,
  currentIndex,
  onPrev,
  onNext,
}: {
  attachments: AttachmentItem[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const current = attachments[currentIndex];
  const total = attachments.length;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onPrev, onNext]);

  if (!current) return null;

  return (
    <div className="flex h-full w-full flex-col">
      {/* Image area */}
      <div className="relative flex flex-1 items-center justify-center bg-black/80">
        <LightboxImage
          key={current.id}
          attachment={current}
        />

        {total > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              onClick={onPrev}
              aria-label="Ảnh trước"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full shadow-md"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={onNext}
              aria-label="Ảnh kế tiếp"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full shadow-md"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t bg-background px-4 py-3">
        <div className="text-xs text-muted-foreground">
          Ảnh {currentIndex + 1} / {total}
          {current.createdAt && (
            <span className="ml-2">
              · Đăng lúc{" "}
              {format(new Date(current.createdAt), "HH:mm dd/MM/yyyy", {
                locale: vi,
              })}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a
            href={current.url}
            target="_blank"
            rel="noreferrer noopener"
            download
          >
            <Download className="mr-1 h-4 w-4" />
            Tải xuống
          </a>
        </Button>
      </div>
    </div>
  );
}

/**
 * Lưới ảnh đính kèm + lightbox. Click thumbnail → mở dialog full-size với
 * điều hướng prev/next + phím tắt ←/→/Esc + nút tải xuống.
 *
 * Để gallery ẩn hoàn toàn khi không có ảnh, caller wrap component này trong
 * card riêng và check `attachments.length > 0` trước.
 */
export function AttachmentGallery({
  attachments,
  className,
}: AttachmentGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const total = attachments.length;
  const isOpen = openIndex !== null;

  const handleClose = useCallback(() => setOpenIndex(null), []);

  const handlePrev = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i - 1 + total) % total));
  }, [total]);

  const handleNext = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i + 1) % total));
  }, [total]);

  if (total === 0) return null;

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4",
          className,
        )}
      >
        {attachments.map((att, i) => (
          <Thumbnail
            key={att.id}
            attachment={att}
            index={i}
            onOpen={setOpenIndex}
          />
        ))}
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => (open ? null : handleClose())}
      >
        <DialogContent className="max-w-5xl p-0 sm:rounded-lg overflow-hidden">
          <DialogTitle className="sr-only">Xem ảnh đính kèm</DialogTitle>
          <DialogDescription className="sr-only">
            Bấm phím mũi tên trái/phải để chuyển ảnh, Esc để đóng.
          </DialogDescription>
          {isOpen && (
            <Lightbox
              attachments={attachments}
              currentIndex={openIndex}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
