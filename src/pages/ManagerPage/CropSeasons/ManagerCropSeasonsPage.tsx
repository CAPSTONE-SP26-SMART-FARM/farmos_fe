import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useManagerListCropSeasons,
  useCreateCropSeason,
  useUpdateCropSeason,
  useSendProductionRequest,
  useManagerListRequests,
} from "@/queries/useCropSeason";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateCropSeasonBodySchema,
  UpdateCropSeasonBodySchema,
  SendProductionRequestBodySchema,
  ProductionStatusName,
  type CreateCropSeasonBodyType,
  type UpdateCropSeasonBodyType,
  type SendProductionRequestBodyType,
  type CropSeasonType,
} from "@/types/cropSeason";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { Plus, Eye, Send, Pencil, Loader2, Clock } from "lucide-react";
import { format } from "date-fns";
import ProPagination from "@/components/common/pro-pagination";

// ── Helpers ───────────────────────────────────────────────────────────────

const STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  planning: { label: "Lên kế hoạch", variant: "secondary" },
  sent: { label: "Đã gửi", variant: "default" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Bị từ chối", variant: "destructive" },
  active: { label: "Đang hoạt động", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

const REQUEST_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  pending: { label: "Chờ duyệt", variant: "secondary" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? {
    label: status,
    variant: "secondary" as const,
  };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return d;
  }
}

const canEdit = (status: string) => status === ProductionStatusName.Planning;
const canSend = (status: string) =>
  status === ProductionStatusName.Planning ||
  status === ProductionStatusName.Rejected;

// ── Field wrapper — chuẩn hoá spacing label + input ──────────────────────

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Create Dialog — #46 ───────────────────────────────────────────────────

function CreateCropSeasonDialog({ zoneId }: { zoneId: string }) {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useCreateCropSeason();
  const form = useForm<CreateCropSeasonBodyType>({
    resolver: zodResolver(CreateCropSeasonBodySchema),
    defaultValues: {
      zoneId,
      cropName: "",
      plantDate: "",
      expectedHarvestDate: "",
    },
  });

  const onSubmit = async (data: CreateCropSeasonBodyType) => {
    await mutateAsync(data);
    setOpen(false);
    form.reset({ zoneId });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Tạo mùa vụ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo mùa vụ mới</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 pt-2"
        >
          <Field
            label="Tên cây trồng *"
            error={form.formState.errors.cropName?.message}
          >
            <Input
              {...form.register("cropName")}
              placeholder="Ớt đỏ, cà chua..."
              autoComplete="off"
            />
          </Field>

          <Field label="Giống / Loại">
            <Input
              {...form.register("variety")}
              placeholder="(tuỳ chọn)"
              autoComplete="off"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Ngày trồng * (YYYY-MM-DD)"
              error={form.formState.errors.plantDate?.message}
            >
              <Input
                {...form.register("plantDate")}
                placeholder="2026-07-01"
                autoComplete="off"
              />
            </Field>
            <Field
              label="Ngày thu hoạch dự kiến *"
              error={form.formState.errors.expectedHarvestDate?.message}
            >
              <Input
                {...form.register("expectedHarvestDate")}
                placeholder="2026-10-01"
                autoComplete="off"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Diện tích (m²)">
              <Input
                type="number"
                {...form.register("totalAreaSqm", { valueAsNumber: true })}
                autoComplete="off"
              />
            </Field>
            <Field label="Số lượng cây">
              <Input
                type="number"
                {...form.register("plantCount", { valueAsNumber: true })}
                autoComplete="off"
              />
            </Field>
          </div>

          <Field label="Ghi chú">
            <Textarea
              {...form.register("notes")}
              rows={2}
              className="resize-none"
            />
          </Field>

          <p className="text-xs text-muted-foreground">
            * Ngày trồng phải sau hôm nay ít nhất 1 tháng. Ngày thu hoạch phải
            sau ngày trồng ít nhất 1 tháng.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo mùa vụ
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Update Dialog — #49 ───────────────────────────────────────────────────

function UpdateCropSeasonDialog({ season }: { season: CropSeasonType }) {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useUpdateCropSeason(season.id);
  const form = useForm<UpdateCropSeasonBodyType>({
    resolver: zodResolver(UpdateCropSeasonBodySchema),
    defaultValues: {
      cropName: season.cropName,
      variety: season.variety ?? "",
      plantDate: season.plantDate,
      expectedHarvestDate: season.expectedHarvestDate,
      totalAreaSqm: season.totalAreaSqm ?? undefined,
      plantCount: season.plantCount ?? undefined,
      notes: season.notes ?? "",
    },
  });

  if (!canEdit(season.status)) return null;

  const onSubmit = async (data: UpdateCropSeasonBodyType) => {
    await mutateAsync(data);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
        >
          <Pencil className="h-3 w-3 mr-1" />
          Sửa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cập nhật mùa vụ</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 pt-2"
        >
          <Field
            label="Tên cây trồng"
            error={form.formState.errors.cropName?.message}
          >
            <Input
              {...form.register("cropName")}
              autoComplete="off"
            />
          </Field>
          <Field label="Giống / Loại">
            <Input
              {...form.register("variety")}
              autoComplete="off"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày trồng (YYYY-MM-DD)">
              <Input
                {...form.register("plantDate")}
                autoComplete="off"
              />
            </Field>
            <Field label="Ngày thu hoạch dự kiến">
              <Input
                {...form.register("expectedHarvestDate")}
                autoComplete="off"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Diện tích (m²)">
              <Input
                type="number"
                {...form.register("totalAreaSqm", { valueAsNumber: true })}
                autoComplete="off"
              />
            </Field>
            <Field label="Số lượng cây">
              <Input
                type="number"
                {...form.register("plantCount", { valueAsNumber: true })}
                autoComplete="off"
              />
            </Field>
          </div>
          <Field label="Ghi chú">
            <Textarea
              {...form.register("notes")}
              rows={2}
              className="resize-none"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Send Request Dialog — #50 ─────────────────────────────────────────────

function SendRequestDialog({ season }: { season: CropSeasonType }) {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useSendProductionRequest(season.id);
  const form = useForm<SendProductionRequestBodyType>({
    resolver: zodResolver(SendProductionRequestBodySchema),
    defaultValues: { description: "" },
  });

  if (season.status === ProductionStatusName.Sent) {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled
      >
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
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={
            season.status === ProductionStatusName.Rejected
              ? "destructive"
              : "default"
          }
        >
          <Send className="h-3 w-3 mr-1" />
          {season.status === ProductionStatusName.Rejected
            ? "Gửi lại"
            : "Gửi duyệt"}
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
            Gửi mùa vụ <strong>{season.cropName}</strong> lên Owner để phê
            duyệt. Sau khi gửi, mùa vụ <strong>không thể chỉnh sửa thêm</strong>
            .
          </p>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Field label="Ghi chú cho Owner (tuỳ chọn)">
              <Textarea
                {...form.register("description")}
                rows={3}
                placeholder="Mô tả thêm về kế hoạch..."
                className="resize-none"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={isPending}
              >
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

// ── Detail + Requests — #48 #51 #53 ──────────────────────────────────────

function CropSeasonDetailContent({ season }: { season: CropSeasonType }) {
  const requestsQuery = useManagerListRequests(season.id, {
    page: 1,
    limit: 20,
  });
  const requests = requestsQuery.data?.data.data ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 text-sm">
        {(
          [
            [
              "Trạng thái",
              <StatusBadge
                key="s"
                status={season.status}
              />,
            ],
            ["Ngày trồng", formatDate(season.plantDate)],
            ["Thu hoạch dự kiến", formatDate(season.expectedHarvestDate)],
            ["Thu hoạch thực tế", formatDate(season.actualHarvestDate)],
            [
              "Diện tích",
              season.totalAreaSqm ? `${season.totalAreaSqm} m²` : "—",
            ],
            ["Số cây", season.plantCount ?? "—"],
          ] as [string, React.ReactNode][]
        ).map(([label, value]) => (
          <div
            key={label}
            className="bg-muted/40 rounded-md p-3"
          >
            <p className="text-muted-foreground text-xs mb-1">{label}</p>
            <div className="font-medium">{value}</div>
          </div>
        ))}
      </div>

      {season.notes && (
        <div className="bg-muted/40 rounded-md p-3 text-sm">
          <p className="text-muted-foreground text-xs mb-1">Ghi chú</p>
          <p>{season.notes}</p>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-sm mb-3">
          Lịch sử yêu cầu phê duyệt
          {requests.length > 0 && (
            <span className="ml-2 text-muted-foreground font-normal">
              ({requests.length})
            </span>
          )}
        </h4>
        {requestsQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton
                key={i}
                className="h-12 w-full"
              />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6 bg-muted/20 rounded-md">
            Chưa có yêu cầu nào được gửi
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày phản hồi</TableHead>
                  <TableHead>Ghi chú Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => {
                  const rs = REQUEST_STATUS_MAP[r.status] ?? {
                    label: r.status,
                    variant: "secondary" as const,
                  };
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">
                        {formatDate(r.sentAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rs.variant}>{rs.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(r.repliedAt)}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {r.description ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function CropSeasonDetailDialog({ season }: { season: CropSeasonType }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
        >
          <Eye className="h-3 w-3 mr-1" />
          Chi tiết
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {season.cropName}
            {season.variety ? ` — ${season.variety}` : ""}
          </DialogTitle>
        </DialogHeader>
        {open && <CropSeasonDetailContent season={season} />}
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ManagerCropSeasonsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const statusFilter = (searchParams.get("status") ?? "") as any;
  const [zoneId, setZoneId] = useState("");
  const [zoneInput, setZoneInput] = useState("");

  const { data, isLoading } = useManagerListCropSeasons(zoneId, {
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  const seasons = data?.data.data ?? [];
  const totalPages = data?.data.meta.totalPages ?? 0;
  const totalItems = data?.data.meta.totalItems ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Manager Portal</Badge>
          <h1 className="text-2xl font-bold">Quản lý mùa vụ</h1>
          <p className="text-muted-foreground">
            Lên kế hoạch, theo dõi và gửi phê duyệt mùa vụ cho Owner.
          </p>
        </div>
        {zoneId && <CreateCropSeasonDialog zoneId={zoneId} />}
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2 items-end">
            <Field
              label="Zone ID (lấy từ npm run prisma:seed output)"
              className="flex-1"
            >
              <Input
                value={zoneInput}
                onChange={(e) => setZoneInput(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono text-sm"
                autoComplete="off"
              />
            </Field>
            <Button
              variant="outline"
              className="mb-0.5"
              onClick={() => {
                setZoneId(zoneInput.trim());
                setSearchParams(new URLSearchParams());
              }}
            >
              Tải danh sách
            </Button>
          </div>
        </CardContent>
      </Card>

      {zoneId && (
        <div className="flex gap-2 items-center">
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => {
              const p = new URLSearchParams(searchParams);
              if (v === "all") {
                p.delete("status");
              } else {
                p.set("status", v);
              }
              p.delete("page");
              setSearchParams(p);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <SelectItem
                  key={k}
                  value={k}
                >
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {statusFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const p = new URLSearchParams(searchParams);
                p.delete("status");
                setSearchParams(p);
              }}
            >
              Xoá bộ lọc
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Danh sách mùa vụ
            {!isLoading && zoneId && (
              <span className="text-muted-foreground font-normal text-sm">
                ({totalItems} mùa vụ)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cây trồng</TableHead>
                  <TableHead>Giống</TableHead>
                  <TableHead>Ngày trồng</TableHead>
                  <TableHead>Thu hoạch dự kiến</TableHead>
                  <TableHead>Diện tích</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!isLoading && seasons.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-12"
                    >
                      {!zoneId
                        ? "Nhập Zone ID ở trên để xem danh sách mùa vụ"
                        : 'Chưa có mùa vụ nào. Bấm "Tạo mùa vụ" để bắt đầu!'}
                    </TableCell>
                  </TableRow>
                )}
                {seasons.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.cropName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.variety ?? "—"}
                    </TableCell>
                    <TableCell>{formatDate(s.plantDate)}</TableCell>
                    <TableCell>{formatDate(s.expectedHarvestDate)}</TableCell>
                    <TableCell>
                      {s.totalAreaSqm ? `${s.totalAreaSqm} m²` : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end flex-wrap">
                        <CropSeasonDetailDialog season={s} />
                        <UpdateCropSeasonDialog season={s} />
                        <SendRequestDialog season={s} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-muted-foreground">
                Trang {page} / {totalPages}
              </p>
              <ProPagination
                currentPage={page}
                totalPages={totalPages}
                buildHref={(p) => {
                  const params = new URLSearchParams(searchParams);
                  if (p) {
                    params.set("page", String(p));
                  } else {
                    params.delete("page");
                  }
                  return {
                    pathname: location.pathname,
                    search: params.toString(),
                  };
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
