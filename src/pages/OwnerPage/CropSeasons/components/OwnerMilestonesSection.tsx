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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOwnerListProductionMilestones } from "@/queries/useProductionMilestone";
import { AlertTriangle, ChevronDown, ChevronRight, Milestone } from "lucide-react";
import { Fragment, useState } from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import OwnerMilestoneTasksSection from "@/pages/OwnerPage/EmployeeTasks/OwnerMilestoneTasksSection";
import { MilestoneIotDetail } from "./MilestoneIotDetail";

const MILESTONE_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  pending: { label: "Chờ xử lý", variant: "secondary" },
  in_progress: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return d;
  }
}

interface Props {
  cropSeasonId: string;
  canReportMilestoneIncident: boolean;
}

export function OwnerMilestonesSection({ cropSeasonId, canReportMilestoneIncident }: Props) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"pending" | "in_progress" | "completed" | "">("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const milestonesQuery = useOwnerListProductionMilestones(cropSeasonId, {
    page,
    limit: 8,
    status: statusFilter || undefined,
  });

  const milestones = milestonesQuery.data?.data.data ?? [];
  const meta = milestonesQuery.data?.data.meta;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Milestone className="h-4 w-4" />
              Mốc sản xuất
            </CardTitle>
            <CardDescription>
              {meta ? `${meta.totalItems} mốc` : "Danh sách mốc của mùa vụ"}
            </CardDescription>
          </div>
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => {
              setStatusFilter(v === "all" ? "" : (v as typeof statusFilter));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Lọc mốc" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ xử lý</SelectItem>
              <SelectItem value="in_progress">Đang thực hiện</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestonesQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Milestone className="h-7 w-7 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Không có mốc nào{statusFilter ? " với trạng thái này" : ""}.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Giai đoạn</TableHead>
                    <TableHead>Dự kiến</TableHead>
                    <TableHead>Thực tế</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones
                    .slice()
                    .sort((a, b) => a.milestoneOrder - b.milestoneOrder)
                    .map((milestone) => {
                      const status = MILESTONE_STATUS_MAP[milestone.status] ?? {
                        label: milestone.status,
                        variant: "secondary" as const,
                      };
                      const isExpanded = expandedId === milestone.id;
                      return (
                        <Fragment key={milestone.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setExpandedId(isExpanded ? null : milestone.id)}
                          >
                            <TableCell className="px-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {milestone.milestoneOrder}
                            </TableCell>
                            <TableCell className="font-medium">{milestone.stageName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(milestone.expectedStartDate)}
                              {milestone.expectedEndDate ? ` → ${formatDate(milestone.expectedEndDate)}` : ""}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(milestone.actualStartDate)}
                              {milestone.actualEndDate ? ` → ${formatDate(milestone.actualEndDate)}` : ""}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell>
                              {canReportMilestoneIncident && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title="Báo cáo sự cố"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/dashboard/owner/tickets?milestoneId=${milestone.id}&milestoneName=${encodeURIComponent(`#${milestone.milestoneOrder} ${milestone.stageName}`)}`,
                                    );
                                  }}
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={7} className="p-0 border-t">
                                <div className="px-4 py-3 bg-muted/20">
                                  <Tabs defaultValue="iot" className="space-y-3">
                                    <TabsList variant="line" className="w-full justify-start">
                                      <TabsTrigger value="iot">Thiết bị IoT</TabsTrigger>
                                      <TabsTrigger value="staff">Nhiệm vụ và gán nông dân</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="iot">
                                      <MilestoneIotDetail milestoneId={milestone.id} />
                                    </TabsContent>
                                    <TabsContent value="staff">
                                      <OwnerMilestoneTasksSection milestoneId={milestone.id} />
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                </TableBody>
              </Table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPreviousPage}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trước
                </Button>
                <span className="text-sm text-muted-foreground">{meta.page} / {meta.totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
