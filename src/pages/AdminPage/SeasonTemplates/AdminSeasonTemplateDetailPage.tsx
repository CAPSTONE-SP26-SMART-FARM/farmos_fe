import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAdminSeasonTemplateDetail } from "@/queries/useSeasonTemplate";
import {
  FARM_TYPE_LABEL,
  PRIORITY_LABEL,
  SENSOR_TYPE_LABEL,
  type FarmTypeT,
  type PriorityT,
  type SensorTypeT,
} from "@/schemaValidatation/seasonTemplate";
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  Gauge,
  Layers,
  ListChecks,
  Loader2,
  Sprout,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { fromItems, summarize } from "./seasonTemplate.helpers";

export default function AdminSeasonTemplateDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const detailQuery = useAdminSeasonTemplateDetail(id);

  const detail = detailQuery.data?.data;

  if (detailQuery.isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Không tìm thấy mẫu này.
        </p>
      </div>
    );
  }

  const model = fromItems(detail.items);
  const stats = summarize(model);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/admin/season-templates")}
          size="sm"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Danh sách mẫu
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            navigate(`/dashboard/admin/season-templates/${id}/usage`)
          }
        >
          <BarChart3 className="mr-1 h-4 w-4" />
          Lịch sử sử dụng
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-emerald-600" />
                {detail.name}
                <Badge variant="outline">v{detail.version ?? 1}</Badge>
                {detail.deletedAt ? (
                  <Badge
                    variant="outline"
                    className="text-muted-foreground"
                  >
                    Đã xoá
                  </Badge>
                ) : detail.isActive ? (
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                    Hoạt động
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-muted-foreground"
                  >
                    Vô hiệu
                  </Badge>
                )}
              </CardTitle>
              {detail.description && (
                <CardDescription>{detail.description}</CardDescription>
              )}
              <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                <Badge variant="secondary">
                  {detail.farmType
                    ? FARM_TYPE_LABEL[detail.farmType as FarmTypeT]
                    : "—"}
                </Badge>
                <span>·</span>
                <span>
                  Cập nhật: {new Date(detail.updatedAt).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
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
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Milestones */}
          {model.milestones.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              Mẫu này không có giai đoạn nào.
            </p>
          ) : (
            <div className="space-y-3">
              {model.milestones.map((g, i) => (
                <Card
                  key={i}
                  className="border-l-4 border-l-emerald-500"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-700 border-emerald-200"
                        >
                          #{i + 1}
                        </Badge>
                        {g.milestone.stageName}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        Bắt đầu N+{g.milestone.dayOffset} ·{" "}
                        {g.milestone.expectedDuration} ngày
                      </div>
                    </div>
                    {g.milestone.suggestedNotes && (
                      <p className="text-xs italic text-muted-foreground">
                        {g.milestone.suggestedNotes}
                      </p>
                    )}

                    {g.tasks.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <div className="text-xs font-medium flex items-center gap-1">
                            <ListChecks className="h-3 w-3" />
                            Công việc
                          </div>
                          <ul className="text-sm space-y-1">
                            {g.tasks.map((t, ti) => (
                              <li
                                key={ti}
                                className="flex items-center gap-2"
                              >
                                <Badge
                                  variant="outline"
                                  className={
                                    t.priority === "high"
                                      ? "bg-red-500/10 text-red-700 border-red-200"
                                      : t.priority === "low"
                                        ? "bg-slate-500/10 text-slate-700"
                                        : "bg-blue-500/10 text-blue-700 border-blue-200"
                                  }
                                >
                                  {PRIORITY_LABEL[
                                    (t.priority ?? "medium") as PriorityT
                                  ]}
                                </Badge>
                                <span>{t.title}</span>
                                {t.expectedDurationDays != null && (
                                  <span className="text-xs text-muted-foreground">
                                    · {t.expectedDurationDays} ngày
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}

                    {g.thresholds.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <div className="text-xs font-medium flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            Ngưỡng cảm biến
                          </div>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            {g.thresholds.map((th, ti) => (
                              <div
                                key={ti}
                                className="rounded border bg-muted/30 px-2 py-1 text-xs"
                              >
                                <div className="font-medium">
                                  {SENSOR_TYPE_LABEL[
                                    th.sensorType as SensorTypeT
                                  ] ?? th.sensorType}
                                </div>
                                <div className="text-muted-foreground tabular-nums">
                                  {th.optimalMin} – {th.optimalMax}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        </CardContent>
      </Card>
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
    <div className="rounded-md border bg-muted/30 px-3 py-2 min-w-[80px]">
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums flex items-center justify-center gap-1">
        <Layers className="h-3 w-3 text-muted-foreground" />
        {value}
      </div>
    </div>
  );
}
