import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSendProductionRequest } from "@/queries/useCropSeason";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SendProductionRequestBodySchema,
  type SendProductionRequestBodyType,
  type CropSeasonType,
  ProductionStatusName,
} from "@/types/cropSeason";
import { useState } from "react";
import { Clock, Loader2, Send } from "lucide-react";
import { Field } from "./Field";
import { canSend } from "./helpers";

export function SendRequestDialog({ season }: { season: CropSeasonType }) {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useSendProductionRequest(season.id);
  const form = useForm<SendProductionRequestBodyType>({
    resolver: zodResolver(SendProductionRequestBodySchema),
    defaultValues: { description: "" },
  });

  if (season.status === ProductionStatusName.Sent) {
    return (
      <Button size="sm" variant="secondary" disabled>
        <Clock className="h-3 w-3 mr-1" />
        Đang chờ duyệt
      </Button>
    );
  }

  if (!canSend(season.status)) return null;

  const onSubmit = async (data: SendProductionRequestBodyType) => {
    await mutateAsync(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={season.status === ProductionStatusName.Rejected ? "destructive" : "default"}
        >
          <Send className="h-3 w-3 mr-1" />
          {season.status === ProductionStatusName.Rejected ? "Gửi lại" : "Gửi duyệt"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {season.status === ProductionStatusName.Rejected
              ? "Gửi lại yêu cầu"
              : "Gửi yêu cầu phê duyệt"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {season.status === ProductionStatusName.Rejected && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
              Yêu cầu trước đã bị từ chối. Bạn có thể chỉnh sửa và gửi lại.
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Gửi mùa vụ <strong>{season.cropName}</strong> lên chủ vườn để phê duyệt. Sau khi gửi,
            mùa vụ <strong>không thể chỉnh sửa thêm</strong>.
          </p>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Ghi chú cho chủ vườn (tuỳ chọn)">
              <Textarea
                {...form.register("description")}
                rows={3}
                placeholder="Mô tả thêm về kế hoạch..."
                className="resize-none"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Xác nhận gửi
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
