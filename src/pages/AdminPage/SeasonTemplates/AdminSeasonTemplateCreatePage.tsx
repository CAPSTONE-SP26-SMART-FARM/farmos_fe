import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { cn } from "@/lib/utils";
import { useCreateSeasonTemplate } from "@/queries/useSeasonTemplate";
import {
  FARM_TYPE_LABEL,
  type CreateSeasonTemplateBodyT,
  type FarmTypeT,
} from "@/schemaValidatation/seasonTemplate";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Gauge,
  Info,
  Layers,
  ListChecks,
  Loader2,
  Save,
  Sprout,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import SeasonTemplateBuilder from "./SeasonTemplateBuilder";
import {
  emptyBuilder,
  summarize,
  toItems,
  type BuilderModel,
} from "./seasonTemplate.helpers";
import {
  validateAll,
  type FieldError,
  type SectionKey,
} from "./seasonTemplate.validation";

const NAME_MAX = 255;
const DESC_MAX = 1000;

export default function AdminSeasonTemplateCreatePage() {
  const navigate = useNavigate();

  // ── Form state ──
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const farmType: FarmTypeT = "cultivation";
  const [model, setModel] = useState<BuilderModel>(emptyBuilder());

  // Touch tracking — only show inline errors after the user has interacted
  // with submit (prevents red-flash on a freshly opened form).
  const [showErrors, setShowErrors] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dirty =
    name.trim().length > 0 ||
    description.trim().length > 0 ||
    model.milestones.length > 0 ||
    model.seasonThresholds.length > 0;

  // Browser-level guard for refresh / close / external nav.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ── Validation ──
  const validation = useMemo(
    () =>
      validateAll({
        basic: { name, description, farmType },
        model,
      }),
    [name, description, farmType, model],
  );
  const errors = showErrors ? validation.errors : [];
  const errorsBySection: Record<SectionKey, FieldError[]> = showErrors
    ? validation.bySection
    : { basic: [], milestones: [] };

  const stats = useMemo(() => summarize(model), [model]);
  const totalItems = stats.milestones + stats.tasks + stats.thresholds;
  const overLimit = totalItems > 500;

  // ── Mutation ──
  const createMut = useCreateSeasonTemplate();

  const handleSubmit = async () => {
    setShowErrors(true);
    if (!validation.ok) {
      toast.error("Vui lòng kiểm tra các lỗi trong biểu mẫu.");
      // Scroll to first error section
      const first = validation.errors[0];
      if (first) {
        document
          .getElementById(`section-${first.section}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    if (overLimit) {
      toast.error("Tổng số mục vượt quá 500.");
      return;
    }

    const body: CreateSeasonTemplateBodyT = {
      name: name.trim(),
      description: description.trim() || null,
      farmType,
      items: toItems(model),
    };

    try {
      const res = await createMut.mutateAsync(body);
      toast.success(`Đã tạo mẫu "${body.name}".`);
      // Navigate to detail page if id available
      const newId = res?.data?.id;
      if (newId) {
        navigate(`/dashboard/admin/season-templates/${newId}`, {
          replace: true,
        });
      } else {
        navigate("/dashboard/admin/season-templates", { replace: true });
      }
    } catch (err) {
      toast.error(getApiErrorMessageVi(err));
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/admin/season-templates")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Danh sách mẫu
          </Button>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sprout className="h-6 w-6 text-emerald-600" />
            Tạo Mẫu Vụ Mùa Mới
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Mẫu (template) là <strong>blueprint khởi tạo</strong> — Manager/Owner
            có thể prefill khi tạo vụ và chỉnh sửa tự do trước khi lưu. Vụ đã tạo
            từ mẫu sẽ KHÔNG bị ảnh hưởng nếu sau này mẫu thay đổi (BR-115).
          </p>
        </div>
        <div className="hidden lg:flex w-72 shrink-0">
          <SummarySidebar
            stats={stats}
            errorsCount={errors.length}
            valid={validation.ok}
            overLimit={overLimit}
            totalItems={totalItems}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Left column — sections */}
        <div className="space-y-6 min-w-0">
          {/* ── Section 1: Basic info ── */}
          <SectionCard
            id="section-basic"
            index={1}
            title="Thông tin cơ bản"
            description="Đặt tên, loại trang trại và mô tả ngắn cho mẫu."
            errors={errorsBySection.basic}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2 space-y-1">
                <Label>
                  Tên mẫu <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
                  placeholder="VD: Lúa nước 3 vụ — chuẩn"
                  maxLength={NAME_MAX}
                  className={cn(
                    fieldHasError(errorsBySection.basic, "name") &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                  aria-invalid={fieldHasError(errorsBySection.basic, "name")}
                />
                <CharCount value={name} max={NAME_MAX} />
                <FieldErrorMsg
                  errors={errorsBySection.basic}
                  path="name"
                />
              </div>

              <div className="space-y-1">
                <Label>Loại trang trại</Label>
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted/30">
                  <Badge variant="secondary">Trồng trọt</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hiện tại chỉ hỗ trợ mẫu cho loại trang trại trồng trọt.
                </p>
              </div>

              <div className="space-y-1">
                <Label>Tóm tắt</Label>
                <div className="text-xs text-muted-foreground rounded-md border bg-muted/30 px-3 py-2 h-9 flex items-center">
                  {stats.milestones} giai đoạn · {stats.tasks} công việc ·{" "}
                  {stats.thresholds} ngưỡng
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <Label>Mô tả</Label>
                <Textarea
                  rows={2}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value.slice(0, DESC_MAX))
                  }
                  placeholder="Mô tả ngắn về mục đích / phạm vi của mẫu này."
                  maxLength={DESC_MAX}
                  className={cn(
                    fieldHasError(errorsBySection.basic, "description") &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                <CharCount value={description} max={DESC_MAX} />
                <FieldErrorMsg
                  errors={errorsBySection.basic}
                  path="description"
                />
              </div>
            </div>
          </SectionCard>

          {/* ── Section 2 & 3: Milestones + Season Thresholds (delegated to Builder) ── */}
          <SectionCard
            id="section-milestones"
            index={2}
            title="Giai đoạn, công việc & ngưỡng theo giai đoạn"
            description="Thiết kế các giai đoạn (milestone) — mỗi giai đoạn có thể đính kèm công việc gợi ý và ngưỡng cảm biến áp dụng riêng cho giai đoạn đó."
            errors={errorsBySection.milestones}
          >
            {errorsBySection.milestones.length > 0 && (
              <ErrorList errors={errorsBySection.milestones} />
            )}
            <SeasonTemplateBuilder
              value={model}
              onChange={setModel}
            />
          </SectionCard>

          {/* ── Section 3: Review ── */}
          <SectionCard
            id="section-review"
            index={3}
            title="Xem lại & xác nhận"
            description="Kiểm tra tóm tắt trước khi tạo. Mẫu mới sẽ ở phiên bản v1, hoạt động (active)."
          >
            <ReviewPanel
              name={name}
              description={description}
              farmType={farmType}
              model={model}
              stats={stats}
              valid={validation.ok}
              overLimit={overLimit}
              totalItems={totalItems}
              errors={errors}
            />
          </SectionCard>
        </div>

        {/* Right sidebar — sticky on desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 space-y-3">
            <SummarySidebar
              stats={stats}
              errorsCount={errors.length}
              valid={validation.ok}
              overLimit={overLimit}
              totalItems={totalItems}
            />
          </div>
        </aside>
      </div>

      {/* Sticky bottom action bar */}
      <div className="sticky bottom-0 -mx-6 border-t bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {showErrors && errors.length > 0
              ? `Có ${errors.length} lỗi cần sửa trước khi tạo mẫu.`
              : "Sau khi tạo, mẫu sẽ ở phiên bản 1 và sẵn sàng cho Manager/Owner áp dụng."}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (dirty) {
                  setConfirmOpen(true);
                } else {
                  navigate("/dashboard/admin/season-templates");
                }
              }}
              disabled={createMut.isPending}
            >
              Huỷ
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createMut.isPending || overLimit}
            >
              {createMut.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              Tạo mẫu
            </Button>
          </div>
        </div>
      </div>

      {/* Cancel confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="Huỷ tạo mẫu?"
        description="Các thay đổi chưa lưu sẽ bị mất."
        confirmLabel="Huỷ tạo mẫu"
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="destructive"
        onConfirm={() => {
          setConfirmOpen(false);
          // Allow blocker to bypass for this navigation
          navigate("/dashboard/admin/season-templates");
        }}
        onCancel={() => setConfirmOpen(false)}
      />

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

interface SectionCardProps {
  id: string;
  index: number;
  title: string;
  description?: string;
  errors?: FieldError[];
  children: React.ReactNode;
}

function SectionCard({
  id,
  index,
  title,
  description,
  errors = [],
  children,
}: SectionCardProps) {
  const hasErrors = errors.length > 0;
  return (
    <Card
      id={id}
      className={cn(
        "scroll-mt-4 transition-colors",
        hasErrors && "border-destructive/60",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Badge
                variant="outline"
                className="font-mono"
              >
                {index}
              </Badge>
              {title}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          {hasErrors ? (
            <Badge
              variant="outline"
              className="bg-destructive/10 text-destructive border-destructive/30"
            >
              <AlertCircle className="mr-1 h-3 w-3" />
              {errors.length} lỗi
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 border-emerald-200"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              OK
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function fieldHasError(errors: FieldError[], path: string) {
  return errors.some((e) => e.path === path);
}

function FieldErrorMsg({
  errors,
  path,
}: {
  errors: FieldError[];
  path: string;
}) {
  const e = errors.find((x) => x.path === path);
  if (!e) return null;
  return (
    <p className="text-xs text-destructive flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {e.message}
    </p>
  );
}

function ErrorList({ errors }: { errors: FieldError[] }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-xs font-semibold text-destructive flex items-center gap-1 mb-1">
        <AlertCircle className="h-3 w-3" />
        Cần sửa các lỗi sau:
      </p>
      <ul className="ml-4 list-disc text-xs text-destructive space-y-0.5">
        {errors.slice(0, 8).map((e, i) => (
          <li key={i}>{e.message}</li>
        ))}
        {errors.length > 8 && (
          <li className="italic text-destructive/70">
            … và {errors.length - 8} lỗi khác.
          </li>
        )}
      </ul>
    </div>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  return (
    <p
      className={cn(
        "text-xs text-muted-foreground text-right tabular-nums",
        len > max * 0.9 && "text-amber-600",
        len >= max && "text-destructive",
      )}
    >
      {len} / {max}
    </p>
  );
}

interface SummarySidebarProps {
  stats: { milestones: number; tasks: number; thresholds: number };
  errorsCount: number;
  valid: boolean;
  overLimit: boolean;
  totalItems: number;
}

function SummarySidebar({
  stats,
  errorsCount,
  valid,
  overLimit,
  totalItems,
}: SummarySidebarProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-600" />
          Tóm tắt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row
          icon={<Sprout className="h-3.5 w-3.5 text-emerald-600" />}
          label="Giai đoạn"
          value={stats.milestones}
        />
        <Row
          icon={<ListChecks className="h-3.5 w-3.5 text-blue-600" />}
          label="Công việc"
          value={stats.tasks}
        />
        <Row
          icon={<Gauge className="h-3.5 w-3.5 text-amber-600" />}
          label="Ngưỡng cảm biến"
          value={stats.thresholds}
        />
        <div className="border-t pt-2 mt-2">
          <Row
            icon={<Info className="h-3.5 w-3.5 text-muted-foreground" />}
            label="Tổng mục"
            value={`${totalItems} / 500`}
            valueClass={cn(
              "tabular-nums",
              overLimit && "text-destructive font-semibold",
            )}
          />
        </div>
        <div className="border-t pt-2">
          {errorsCount > 0 ? (
            <Badge
              variant="outline"
              className="w-full justify-center bg-destructive/10 text-destructive border-destructive/30"
            >
              <AlertCircle className="mr-1 h-3 w-3" />
              {errorsCount} lỗi
            </Badge>
          ) : valid ? (
            <Badge className="w-full justify-center bg-emerald-500/10 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Sẵn sàng tạo
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="w-full justify-center"
            >
              Chưa hoàn tất
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        {label}
      </span>
      <span className={cn("font-medium tabular-nums", valueClass)}>
        {value}
      </span>
    </div>
  );
}

interface ReviewProps {
  name: string;
  description: string;
  farmType: FarmTypeT;
  model: BuilderModel;
  stats: { milestones: number; tasks: number; thresholds: number };
  valid: boolean;
  overLimit: boolean;
  totalItems: number;
  errors: FieldError[];
}

function ReviewPanel({
  name,
  description,
  farmType,
  model,
  stats,
  valid,
  overLimit,
  totalItems,
  errors,
}: ReviewProps) {
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <KV
          label="Tên mẫu"
          value={name.trim() || "—"}
        />
        <KV
          label="Loại trang trại"
          value={FARM_TYPE_LABEL[farmType]}
        />
        <KV
          label="Tổng mục"
          value={`${totalItems} / 500`}
          warn={overLimit}
        />
      </div>
      {description.trim() && (
        <KV
          label="Mô tả"
          value={description.trim()}
        />
      )}
      <div className="grid grid-cols-3 gap-2">
        <Stat
          icon={<Sprout className="h-4 w-4 text-emerald-600" />}
          label="Giai đoạn"
          value={stats.milestones}
        />
        <Stat
          icon={<ListChecks className="h-4 w-4 text-blue-600" />}
          label="Công việc"
          value={stats.tasks}
        />
        <Stat
          icon={<Gauge className="h-4 w-4 text-amber-600" />}
          label="Ngưỡng"
          value={stats.thresholds}
        />
      </div>
      {model.milestones.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-3 space-y-1">
          <p className="text-xs font-semibold mb-1">Trình tự giai đoạn:</p>
          <ol className="ml-5 list-decimal text-xs space-y-0.5">
            {model.milestones.map((g, i) => (
              <li key={i}>
                <span className="font-medium">
                  {g.milestone.stageName || "(chưa đặt tên)"}
                </span>{" "}
                <span className="text-muted-foreground">
                  · N+{g.milestone.dayOffset} · {g.milestone.expectedDuration}{" "}
                  ngày · {g.tasks.length} task · {g.thresholds.length} ngưỡng
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {errors.length > 0 ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Có <strong>{errors.length}</strong> lỗi cần sửa trước khi tạo mẫu.
          </span>
        </div>
      ) : valid ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2 dark:bg-emerald-950/20 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Mẫu hợp lệ — sẵn sàng tạo.</span>
        </div>
      ) : null}
    </div>
  );
}

function KV({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <p className="text-[10px] uppercase text-muted-foreground tracking-wide">
        {label}
      </p>
      <p
        className={cn(
          "font-medium break-words",
          warn && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
