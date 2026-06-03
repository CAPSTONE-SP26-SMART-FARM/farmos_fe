import { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  RecoveryBulkCompleteBodyType,
  RecoveryConditionType,
  RecoveryErrorReasonType,
} from "@/schemaValidatation/iotDeviceAdminOps";

type Outcome =
  | { kind: "recovered"; condition: RecoveryConditionType }
  | { kind: "notRecovered"; errorReason: RecoveryErrorReasonType };

interface DeviceLite {
  id: string;
  label: string;
  zoneName: string | null;
  isOnline: boolean;
}

interface Props {
  open: boolean;
  devices: DeviceLite[];
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (body: RecoveryBulkCompleteBodyType) => void;
}

const CONDITION_OPTIONS: { value: RecoveryConditionType; label: string }[] = [
  { value: "good", label: "Thu được — Tốt (chuyển về khả dụng)" },
  { value: "damaged", label: "Thu được — Hỏng (chuyển về lỗi, cần sửa)" },
];

const NOT_RECOVERED_OPTIONS: {
  value: RecoveryErrorReasonType;
  label: string;
}[] = [
  { value: "missing", label: "Mất tích (đánh dấu bị mất)" },
  { value: "destroyed", label: "Bị phá hủy (chuyển về lỗi)" },
  { value: "owner_refused", label: "Chủ trang trại từ chối trả (chuyển về lỗi)" },
];

export function RecoveryCompleteDialog({
  open,
  devices,
  isPending,
  onCancel,
  onConfirm,
}: Props) {
  // Default mọi device = "thu được / tốt" — admin chỉ phải đổi minority case.
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [notes, setNotes] = useState("");

  const initialized = useMemo(() => {
    if (Object.keys(outcomes).length > 0) return outcomes;
    const init: Record<string, Outcome> = {};
    for (const d of devices) {
      init[d.id] = { kind: "recovered", condition: "good" };
    }
    return init;
  }, [devices, outcomes]);

  const current = Object.keys(outcomes).length > 0 ? outcomes : initialized;

  const recoveredCount = Object.values(current).filter(
    (o) => o.kind === "recovered",
  ).length;
  const notRecoveredCount = devices.length - recoveredCount;

  const setOutcome = (id: string, outcome: Outcome) => {
    setOutcomes((prev) => {
      const next = { ...(Object.keys(prev).length > 0 ? prev : initialized) };
      next[id] = outcome;
      return next;
    });
  };

  const handleConfirm = () => {
    const recovered = [];
    const notRecovered = [];
    for (const d of devices) {
      const o = current[d.id];
      if (!o) continue;
      if (o.kind === "recovered") {
        recovered.push({ deviceId: d.id, condition: o.condition });
      } else {
        notRecovered.push({ deviceId: d.id, errorReason: o.errorReason });
      }
    }
    onConfirm({
      recovered,
      notRecovered,
      notes: notes.trim() || undefined,
      context: { visitedAt: new Date().toISOString() },
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && !isPending) {
      setOutcomes({});
      setNotes("");
      onCancel();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Hoàn tất chuyến thu hồi</DialogTitle>
          <DialogDescription>
            Đã chọn {devices.length} thiết bị. Mặc định là thu được và tình
            trạng tốt — chỉ đổi với thiết bị bất thường.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge
            variant="outline"
            className="gap-1 border-emerald-300 text-emerald-700"
          >
            <CheckCircle2
              className="h-3.5 w-3.5"
              aria-hidden
            />
            Thu được: {recoveredCount}
          </Badge>
          <Badge
            variant="outline"
            className="gap-1 border-destructive/40 text-destructive"
          >
            <XCircle
              className="h-3.5 w-3.5"
              aria-hidden
            />
            Không thu: {notRecoveredCount}
          </Badge>
        </div>

        <div className="max-h-[50vh] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Thiết bị</TableHead>
                <TableHead>Khu vực</TableHead>
                <TableHead className="w-[280px]">Kết quả</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((d) => {
                const o = current[d.id];
                const value =
                  o.kind === "recovered"
                    ? `recovered:${o.condition}`
                    : `notRecovered:${o.errorReason}`;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono font-medium">
                      {d.label}
                      {!d.isOnline && (
                        <Badge
                          variant="outline"
                          className="ml-1 text-xs"
                        >
                          Mất kết nối
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.zoneName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={value}
                        onValueChange={(v) => {
                          const [kind, sub] = v.split(":");
                          if (kind === "recovered") {
                            setOutcome(d.id, {
                              kind: "recovered",
                              condition: sub as RecoveryConditionType,
                            });
                          } else {
                            setOutcome(d.id, {
                              kind: "notRecovered",
                              errorReason: sub as RecoveryErrorReasonType,
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPTIONS.map((opt) => (
                            <SelectItem
                              key={`recovered:${opt.value}`}
                              value={`recovered:${opt.value}`}
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                          {NOT_RECOVERED_OPTIONS.map((opt) => (
                            <SelectItem
                              key={`notRecovered:${opt.value}`}
                              value={`notRecovered:${opt.value}`}
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="recovery-notes">Ghi chú chuyến đi (tuỳ chọn)</Label>
          <Textarea
            id="recovery-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Chủ trang trại đang vắng, ra hiện trường tự thu..."
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || devices.length === 0}
          >
            {isPending ? "Đang xử lý..." : "Xác nhận hoàn tất"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
