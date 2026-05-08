import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import {
  useOwnerTicketList,
  useOwnerTicketDetail,
  useEndIncidentTicket,
  useTicketMessages,
  useCreateTicketMessage,
  useTicketPrescriptions,
} from "@/queries/useTicket";
import {
  useCreateTicketV2,
  useOwnerTicketBalance,
} from "@/queries/useTicketV2";
import { useRealtimeTicket } from "@/hooks/useRealtimeTicket";
import { useTicketSubscription } from "@/hooks/useTicketSubscription";
import { useTicketQualityFlag } from "@/hooks/useTicketQualityFlag";
import TicketDetailPanelV2 from "@/components/ticket-quality/TicketDetailPanelV2";
import { RoleName } from "@/constants/role";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";
import {
  CreateTicketV2BodySchema,
  type CreateTicketV2BodyType,
} from "@/schemaValidatation/ticketV2";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Pill,
  Send,
  Ticket,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuthStore } from "@/stores/authStore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSearchParams } from "react-router";
import { useOwnerListZones } from "@/queries/useZone";
import { useOwnerListCropSeasons } from "@/queries/useCropSeason";
import { useOwnerListProductionMilestones } from "@/queries/useProductionMilestone";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import {
  isApiErrorUnprocessableEntityResponse,
  isApiErrorResponse,
} from "@/lib/utils";
import { toast } from "sonner";

// ── Constants ──────────────────────────────────────────────────────────────

const SEVERITY_LABEL: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

const SEVERITY_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
  critical: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Mở",
  assigned: "Đã phân công",
  in_progress: "Đang xử lý",
  resolved: "Đã giải quyết",
  closed: "Đã đóng",
  cancelled: "Đã hủy",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "default",
  assigned: "secondary",
  in_progress: "default",
  resolved: "secondary",
  closed: "outline",
  cancelled: "outline",
};

const ACTIVE_STATUSES = new Set(["open", "assigned", "in_progress"]);

// ── Ticket Detail Panel ────────────────────────────────────────────────────

interface TicketDetailPanelProps {
  ticketId: string;
  onBack: () => void;
}

// Module 3 wrapper — gate UI mới qua feature flag. Phải tách thành component
// riêng để tránh vi phạm rules-of-hooks (early return trước khi gọi hooks
// của TicketDetailPanelLegacy).
function TicketDetailPanel(props: TicketDetailPanelProps) {
  const { enabled: tqEnabled, isLoading: flagLoading } = useTicketQualityFlag();
  const user = useAuthStore((s) => s.user);

  // Khi flag chưa load xong: render skeleton thay vì lộ panel cũ.
  if (flagLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (tqEnabled && user?.id) {
    return (
      <TicketDetailPanelV2
        ticketId={props.ticketId}
        onBack={props.onBack}
        viewerRole="owner"
        viewerUserId={user.id}
      />
    );
  }

  return <TicketDetailPanelLegacy {...props} />;
}

function TicketDetailPanelLegacy({ ticketId, onBack }: TicketDetailPanelProps) {
  const [show, setShow] = useState(false);
  const [msgPage] = useState(1);
  const [rxPage] = useState(1);
  const [msgText, setMsgText] = useState("");
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);

  // Realtime: subscribe room ticket + listen ticket.message.created.
  useTicketSubscription(ticketId);

  const { data: ticketData, isLoading: ticketLoading } =
    useOwnerTicketDetail(ticketId);
  const { data: msgData } = useTicketMessages(ticketId, {
    page: msgPage,
    limit: 50,
  });
  const { data: rxData } = useTicketPrescriptions(ticketId, {
    page: rxPage,
    limit: 20,
  });

  const endMutation = useEndIncidentTicket();
  const sendMutation = useCreateTicketMessage(ticketId);

  const ticket = ticketData?.data;
  const messages = msgData?.data.data ?? [];
  const prescriptions = rxData?.data.data ?? [];

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const handleSend = () => {
    if (!msgText.trim()) return;
    sendMutation.mutate(
      { message: msgText.trim() },
      { onSuccess: () => setMsgText("") },
    );
  };

  const handleEnd = () => {
    endMutation.mutate(ticketId, {
      onSuccess: () => {
        setEndConfirmOpen(false);
        handleBack();
      },
    });
  };

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <Badge className="mb-1">Chi tiết ticket</Badge>
          <h1 className="text-2xl font-bold">
            {ticketLoading ? "Đang tải..." : (ticket?.title ?? "Ticket")}
          </h1>
        </div>
      </div>

      <Separator />

      {ticketLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 w-full"
            />
          ))}
        </div>
      ) : !ticket ? (
        <p className="text-sm text-muted-foreground">Không tìm thấy ticket.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Ticket Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Thông tin sự cố
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã ticket</span>
                  <span className="font-mono text-xs">
                    {ticket.ticketNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <Badge variant={STATUS_VARIANT[ticket.status]}>
                    {STATUS_LABEL[ticket.status]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mức độ</span>
                  <Badge variant={SEVERITY_VARIANT[ticket.severity]}>
                    {SEVERITY_LABEL[ticket.severity]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khu vực</span>
                  <span>{ticket.zone?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bác sĩ</span>
                  <span>{ticket.assignee?.fullName ?? "Chưa phân công"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạo lúc</span>
                  <span>
                    {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </span>
                </div>
                <Separator />
                <p className="text-muted-foreground text-xs">Mô tả</p>
                <p className="text-sm leading-relaxed">{ticket.description}</p>

                {ACTIVE_STATUSES.has(ticket.status) &&
                  ticket.createdBy === user?.id && (
                    <>
                      <Separator />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => setEndConfirmOpen(true)}
                        disabled={endMutation.isPending}
                      >
                        Kết thúc ticket
                      </Button>
                    </>
                  )}
              </CardContent>
            </Card>

            {/* Prescriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Đơn thuốc ({prescriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {prescriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Chưa có đơn thuốc.
                  </p>
                ) : (
                  prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="rounded-md border p-3 text-sm"
                    >
                      <p className="font-medium">{rx.medicineName}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Liều: {rx.dosage}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {format(new Date(rx.createdAt), "dd/MM HH:mm", {
                          locale: vi,
                        })}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Messages */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-150">
              <CardHeader className="shrink-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Hội thoại
                </CardTitle>
                <CardDescription>Trao đổi với bác sĩ về sự cố</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Chưa có tin nhắn. Hãy gửi tin nhắn đầu tiên.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-1 max-w-[80%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                      >
                        {!isMe && (
                          <span className="text-xs text-muted-foreground px-1">
                            {msg.sender.fullName}
                          </span>
                        )}
                        <div
                          className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                            isMe
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-xs text-muted-foreground px-1">
                          {format(new Date(msg.createdAt), "HH:mm dd/MM", {
                            locale: vi,
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              {/* Input */}
              {ACTIVE_STATUSES.has(ticket.status) && (
                <div className="shrink-0 border-t p-3 flex gap-2">
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={sendMutation.isPending || !msgText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={endConfirmOpen}
        onCancel={() => setEndConfirmOpen(false)}
        title="Kết thúc ticket?"
        description="Sau khi kết thúc, ticket sẽ được đóng và không thể nhắn tin thêm. Bạn có chắc chắn không?"
        confirmLabel="Kết thúc"
        variant="destructive"
        onConfirm={handleEnd}
      />
    </div>
  );
}

// ── Create Ticket Panel ─────────────────────────────────────────────────────

interface CreateTicketPanelProps {
  farmId: string;
  initialMilestoneId?: string;
  initialMilestoneName?: string;
  onBack: () => void;
  onCreated: () => void;
}

function CreateTicketPanel({
  farmId,
  initialMilestoneId,
  initialMilestoneName,
  onBack,
  onCreated,
}: CreateTicketPanelProps) {
  const [show, setShow] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedCropSeasonId, setSelectedCropSeasonId] = useState("");

  // V2 mutation — POST /tickets với categoryConfigId. BE lock unitPrice +
  // commissionPercent vào snapshot ngay tại bước create (walkthrough Bước 1).
  const createMutation = useCreateTicketV2();
  // Balance để biết category nào còn dư quota (subscription grant + purchased).
  const balanceQuery = useOwnerTicketBalance();
  const balanceItems = balanceQuery.data?.data.data ?? [];
  // Chỉ render category còn `total > 0` — tránh user submit fail 422
  // `TicketInsufficientBalance` từ BE.
  const eligibleCategories = balanceItems.filter((b) => b.total > 0);

  const zonesQuery = useOwnerListZones(farmId, { page: 1, limit: 100 });
  const zones = zonesQuery.data?.data.data ?? [];

  const cropSeasonsQuery = useOwnerListCropSeasons(selectedZoneId, {
    page: 1,
    limit: 100,
  });
  const cropSeasons = cropSeasonsQuery.data?.data.data ?? [];

  const milestonesQuery = useOwnerListProductionMilestones(
    selectedCropSeasonId,
    { page: 1, limit: 100 },
  );
  const milestones = milestonesQuery.data?.data.data ?? [];

  const form = useForm<CreateTicketV2BodyType>({
    resolver: zodResolver(CreateTicketV2BodySchema),
    defaultValues: {
      milestoneId: initialMilestoneId ?? "",
      categoryConfigId: "",
      title: "",
      description: "",
      severity: "low",
    },
  });
  useClearServerFieldErrors(form);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const onSubmit = async (data: CreateTicketV2BodyType) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success("Đã tạo ticket sự cố thành công.");
      onCreated();
      handleBack();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse<CreateTicketV2BodyType>(error)) {
        handleApiErrorUnprocessentity<CreateTicketV2BodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }

      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Tạo ticket thất bại");
        return;
      }

      toast.error("Tạo ticket thất bại");
    }
  };

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <Badge className="mb-1">Báo cáo sự cố</Badge>
          <h1 className="text-2xl font-bold">Tạo ticket sự cố</h1>
        </div>
      </div>

      <Separator />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Thông tin sự cố
          </CardTitle>
          <CardDescription>
            Điền thông tin sự cố để gửi đến bác sĩ hỗ trợ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Category selector — V2 yêu cầu categoryConfigId */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Loại ticket *</label>
              <Select
                value={form.watch("categoryConfigId")}
                onValueChange={(v) =>
                  form.setValue("categoryConfigId", v, {
                    shouldValidate: true,
                  })
                }
                disabled={balanceQuery.isLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      balanceQuery.isLoading
                        ? "Đang tải quota..."
                        : eligibleCategories.length === 0
                          ? "Hết quota — vui lòng nạp gói hoặc mua thêm"
                          : "Chọn loại ticket"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {eligibleCategories.map((c) => (
                    <SelectItem
                      key={c.categoryConfigId}
                      value={c.categoryConfigId}
                    >
                      {c.categoryName} — còn {c.total} (gói {c.fromSubscription}{" "}
                      / mua lẻ {c.fromPurchased})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryConfigId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.categoryConfigId.message}
                </p>
              )}
              {!balanceQuery.isLoading && eligibleCategories.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Tài khoản hiện không có quota cho bất kỳ loại ticket nào.
                </p>
              )}
            </div>

            {/* Milestone selector */}
            {initialMilestoneId ? (
              <div className="rounded-md border p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">
                  Mốc sản xuất
                </p>
                <p className="text-sm font-medium">
                  {initialMilestoneName || initialMilestoneId}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Khu vực</label>
                  <Select
                    value={selectedZoneId}
                    onValueChange={(v) => {
                      setSelectedZoneId(v);
                      setSelectedCropSeasonId("");
                      form.setValue("milestoneId", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          zonesQuery.isLoading ? "Đang tải..." : "Chọn khu vực"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((z) => (
                        <SelectItem
                          key={z.id}
                          value={z.id}
                        >
                          {z.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedZoneId && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Mùa vụ</label>
                    <Select
                      value={selectedCropSeasonId}
                      onValueChange={(v) => {
                        setSelectedCropSeasonId(v);
                        form.setValue("milestoneId", "", {
                          shouldValidate: true,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            cropSeasonsQuery.isLoading
                              ? "Đang tải..."
                              : "Chọn mùa vụ"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {cropSeasons.map((cs) => (
                          <SelectItem
                            key={cs.id}
                            value={cs.id}
                          >
                            {cs.cropName}
                            {cs.variety ? ` — ${cs.variety}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedCropSeasonId && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Mốc sản xuất</label>
                    <Select
                      value={form.watch("milestoneId") ?? ""}
                      onValueChange={(v) =>
                        form.setValue("milestoneId", v, {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            milestonesQuery.isLoading
                              ? "Đang tải..."
                              : "Chọn mốc sản xuất"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {milestones.map((m) => (
                          <SelectItem
                            key={m.id}
                            value={m.id}
                          >
                            #{m.milestoneOrder} {m.stageName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.milestoneId && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.milestoneId.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">Tiêu đề</label>
              <Input
                placeholder="Ví dụ: Cây bị vàng lá nghiêm trọng"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Mô tả chi tiết</label>
              <Textarea
                placeholder="Mô tả triệu chứng, thời gian phát hiện, phạm vi ảnh hưởng..."
                rows={4}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Mức độ nghiêm trọng</label>
              <Select
                value={form.watch("severity")}
                onValueChange={(v) =>
                  form.setValue(
                    "severity",
                    v as CreateTicketV2BodyType["severity"],
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mức độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="critical">Nghiêm trọng</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.severity && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.severity.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  (!balanceQuery.isLoading && eligibleCategories.length === 0)
                }
                className="flex-1"
              >
                {createMutation.isPending ? "Đang gửi..." : "Gửi báo cáo"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
              >
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

function OwnerTicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMilestoneId = searchParams.get("milestoneId");
  const urlMilestoneName = searchParams.get("milestoneName");

  const [page, setPage] = useState(1);
  const limit = 10;
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(!!urlMilestoneId);

  const { data: myFarmData, isLoading: farmLoading } = useOwnerGetMyFarm();
  const farmId = myFarmData?.data.id ?? "";

  const { data, isLoading, isError } = useOwnerTicketList(farmId, {
    page,
    limit,
  });

  // Realtime: invalidate list khi có ticket mới / kết thúc thuộc farm này.
  useRealtimeTicket(RoleName.Owner, { farmId });

  const tickets = (data?.data.data ?? []) as TicketIncidentResType[];
  const meta = data?.data.meta;

  const columns: ColumnDef<TicketIncidentResType>[] = [
    {
      accessorKey: "ticketNumber",
      header: "Mã",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.ticketNumber}</span>
      ),
    },
    {
      accessorKey: "title",
      header: "Tiêu đề",
      cell: ({ row }) => (
        <span className="font-medium max-w-50 truncate block">
          {row.original.title}
        </span>
      ),
    },
    {
      id: "zone",
      header: "Khu vực",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.zone?.name ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "severity",
      header: "Mức độ",
      cell: ({ row }) => (
        <Badge
          variant={SEVERITY_VARIANT[row.original.severity]}
          className="text-xs"
        >
          {SEVERITY_LABEL[row.original.severity]}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge
          variant={STATUS_VARIANT[row.original.status]}
          className="text-xs"
        >
          {STATUS_LABEL[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "assignee",
      header: "Bác sĩ",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.assignee?.fullName ?? "Chưa phân công"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.createdAt), "dd/MM/yy HH:mm", {
            locale: vi,
          })}
        </span>
      ),
    },
  ];

  if (showCreate) {
    return (
      <CreateTicketPanel
        farmId={farmId}
        initialMilestoneId={urlMilestoneId ?? undefined}
        initialMilestoneName={urlMilestoneName ?? undefined}
        onBack={() => {
          setShowCreate(false);
          if (urlMilestoneId) setSearchParams({});
        }}
        onCreated={() => setPage(1)}
      />
    );
  }

  if (viewingTicketId) {
    return (
      <TicketDetailPanel
        ticketId={viewingTicketId}
        onBack={() => setViewingTicketId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Cổng chủ vườn</Badge>
          <h1 className="text-2xl font-bold">Sự Cố & Ticket</h1>
          <p className="text-muted-foreground">
            Theo dõi các sự cố trong nông trại và trạng thái hỗ trợ từ bác sĩ.
          </p>
        </div>
      </div>

      {!farmId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
            {farmLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-1">
                  Chưa có nông trại
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Tài khoản của bạn chưa liên kết với nông trại nào.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Danh sách sự cố
            </CardTitle>
            <CardDescription>
              Tất cả ticket sự cố thuộc nông trại của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <p className="text-sm text-destructive text-center py-8">
                Không tải được danh sách. Vui lòng thử lại.
              </p>
            ) : !isLoading && tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Ticket className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Không có sự cố nào. Trang trại hoạt động tốt!
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <DataTable
                    columns={columns}
                    data={tickets}
                    isLoading={isLoading}
                    actions={[
                      {
                        key: "view",
                        label: "Xem",
                        icon: Eye,
                        onSelect: (ticket) => setViewingTicketId(ticket.id),
                      },
                    ]}
                    onRowClick={(ticket) => setViewingTicketId(ticket.id)}
                    emptyText="Không có sự cố nào."
                  />
                </div>

                {/* Pagination */}
                {meta && meta.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
                    <span>
                      Trang {meta.page} / {meta.totalPages} ({meta.totalItems}{" "}
                      ticket)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!meta.hasPreviousPage}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!meta.hasNextPage}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default OwnerTicketsPage;
