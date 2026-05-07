import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useManagerListAssignedZones } from "@/queries/useZone";
import {
  useManagerTicketList,
  useManagerTicketDetail,
  useCreateIncidentTicket,
  useEndIncidentTicket,
  useTicketMessages,
  useCreateTicketMessage,
  useTicketPrescriptions,
} from "@/queries/useTicket";
import { useRealtimeTicket } from "@/hooks/useRealtimeTicket";
import { useTicketSubscription } from "@/hooks/useTicketSubscription";
import { useTicketQualityFlag } from "@/hooks/useTicketQualityFlag";
import TicketDetailPanelV2 from "@/components/ticket-quality/TicketDetailPanelV2";
import { RoleName } from "@/constants/role";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";
import {
  CreateIncidentTicketBodySchema,
  type CreateIncidentTicketBodyType,
} from "@/schemaValidatation/ticket";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Map,
  MessageSquare,
  Pill,
  Plus,
  Send,
  Ticket,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuthStore } from "@/stores/authStore";
import { useSearchParams } from "react-router";
import { useManagerListCropSeasons } from "@/queries/useCropSeason";
import { useManagerListProductionMilestones } from "@/queries/useProductionMilestone";
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

// Module 3 wrapper — gate UI mới qua feature flag.
function TicketDetailPanel(props: TicketDetailPanelProps) {
  const { enabled: tqEnabled, isLoading: flagLoading } = useTicketQualityFlag();
  const user = useAuthStore((s) => s.user);

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
        viewerRole="manager"
        viewerUserId={user.id}
      />
    );
  }

  return <TicketDetailPanelLegacy {...props} />;
}

function TicketDetailPanelLegacy({ ticketId, onBack }: TicketDetailPanelProps) {
  const [show, setShow] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);

  // Realtime: subscribe ticket room + listen ticket.message.created.
  useTicketSubscription(ticketId);

  const { data: ticketData, isLoading: ticketLoading } =
    useManagerTicketDetail(ticketId);
  const { data: msgData } = useTicketMessages(ticketId, { page: 1, limit: 50 });
  const { data: rxData } = useTicketPrescriptions(ticketId, {
    page: 1,
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
          {/* Ticket Info */}
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
                  <span className="text-muted-foreground">Người báo</span>
                  <span>{ticket.creator.fullName}</span>
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

          {/* Messages */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-150">
              <CardHeader className="shrink-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Hội thoại
                </CardTitle>
                <CardDescription>Trao đổi với bác sĩ</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Chưa có tin nhắn.
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
                          className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}
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
        description="Sau khi kết thúc, ticket sẽ được đóng. Bạn có chắc chắn không?"
        confirmLabel="Kết thúc"
        variant="destructive"
        onConfirm={handleEnd}
      />
    </div>
  );
}

// ── Create Ticket Panel ────────────────────────────────────────────────────

interface CreateTicketPanelProps {
  initialZoneId?: string;
  initialMilestoneId?: string;
  initialMilestoneName?: string;
  onBack: () => void;
  onCreated: () => void;
}

function CreateTicketPanel({
  initialZoneId,
  initialMilestoneId,
  initialMilestoneName,
  onBack,
  onCreated,
}: CreateTicketPanelProps) {
  const [show, setShow] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState(initialZoneId ?? "");
  const [selectedCropSeasonId, setSelectedCropSeasonId] = useState("");

  const createMutation = useCreateIncidentTicket();

  const zonesQuery = useManagerListAssignedZones({ page: 1, limit: 100 });
  const zones = zonesQuery.data?.data.data ?? [];

  const cropSeasonsQuery = useManagerListCropSeasons(selectedZoneId, {
    page: 1,
    limit: 100,
  });
  const cropSeasons = cropSeasonsQuery.data?.data.data ?? [];

  const milestonesQuery = useManagerListProductionMilestones(
    selectedCropSeasonId,
    { page: 1, limit: 100 },
  );
  const milestones = milestonesQuery.data?.data.data ?? [];

  const form = useForm<CreateIncidentTicketBodyType>({
    resolver: zodResolver(CreateIncidentTicketBodySchema),
    defaultValues: {
      milestoneId: initialMilestoneId ?? "",
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

  const onSubmit = async (data: CreateIncidentTicketBodyType) => {
    try {
      await createMutation.mutateAsync(data);
      onCreated();
      handleBack();
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<CreateIncidentTicketBodyType>(
          error,
        )
      ) {
        handleApiErrorUnprocessentity<CreateIncidentTicketBodyType>(
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
            Điền thông tin sự cố trong khu vực quản lý của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
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
                        form.setValue("milestoneId", "");
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
                      value={form.watch("milestoneId")}
                      onValueChange={(v) => form.setValue("milestoneId", v)}
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
                placeholder="Ví dụ: Phát hiện sâu bệnh"
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
                placeholder="Mô tả triệu chứng, phạm vi, thời gian phát hiện..."
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
                defaultValue="low"
                onValueChange={(v) =>
                  form.setValue(
                    "severity",
                    v as CreateIncidentTicketBodyType["severity"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
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
                disabled={createMutation.isPending}
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

function ManagerTicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMilestoneId = searchParams.get("milestoneId");
  const urlMilestoneName = searchParams.get("milestoneName");

  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(!!urlMilestoneId);

  const zonesQuery = useManagerListAssignedZones({ page: 1, limit: 100 });
  const zones = zonesQuery.data?.data.data ?? [];

  // Default to first zone
  useEffect(() => {
    if (zones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(zones[0].id);
    }
  }, [zones, selectedZoneId]);

  const { data, isLoading, isError } = useManagerTicketList(selectedZoneId, {
    page,
    limit,
  });

  // Realtime: invalidate ticket list khi có event thuộc zone đang xem.
  useRealtimeTicket(RoleName.Manager, { zoneId: selectedZoneId });

  const tickets = data?.data.data ?? [];
  const meta = data?.data.meta;

  if (showCreate) {
    return (
      <CreateTicketPanel
        initialZoneId={selectedZoneId || undefined}
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
          <Badge className="mb-2">Cổng quản lý</Badge>
          <h1 className="text-2xl font-bold">Sự Cố & Ticket</h1>
          <p className="text-muted-foreground">
            Theo dõi sự cố trong các khu vực bạn quản lý.
          </p>
        </div>
      </div>

      {/* Zone selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Map className="h-4 w-4" />
            Chọn khu vực
          </CardTitle>
        </CardHeader>
        <CardContent>
          {zonesQuery.isLoading ? (
            <Skeleton className="h-10 w-64" />
          ) : zones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Bạn chưa được phân công khu vực nào.
            </p>
          ) : (
            <Select
              value={selectedZoneId}
              onValueChange={(v) => {
                setSelectedZoneId(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Chọn khu vực" />
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
          )}
        </CardContent>
      </Card>

      {selectedZoneId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Danh sách sự cố
            </CardTitle>
            <CardDescription>
              Ticket sự cố trong khu vực đã chọn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-12 w-full"
                  />
                ))}
              </div>
            ) : isError ? (
              <p className="text-sm text-destructive text-center py-8">
                Không tải được danh sách. Vui lòng thử lại.
              </p>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Ticket className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Không có sự cố nào trong khu vực này.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã</TableHead>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Người báo</TableHead>
                        <TableHead>Mức độ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Bác sĩ</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket: TicketIncidentResType) => (
                        <TableRow
                          key={ticket.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setViewingTicketId(ticket.id)}
                        >
                          <TableCell className="font-mono text-xs">
                            {ticket.ticketNumber}
                          </TableCell>
                          <TableCell className="font-medium max-w-45 truncate">
                            {ticket.title}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {ticket.creator.fullName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={SEVERITY_VARIANT[ticket.severity]}
                              className="text-xs"
                            >
                              {SEVERITY_LABEL[ticket.severity]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={STATUS_VARIANT[ticket.status]}
                              className="text-xs"
                            >
                              {STATUS_LABEL[ticket.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {ticket.assignee?.fullName ?? "Chưa phân công"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(
                              new Date(ticket.createdAt),
                              "dd/MM/yy HH:mm",
                              { locale: vi },
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingTicketId(ticket.id);
                              }}
                            >
                              Xem
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

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

export default ManagerTicketsPage;
