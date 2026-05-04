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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useOwnerListRequests } from "@/queries/useCropSeason";
import type { ProductionRequestType } from "@/types/cropSeason";
import { ClipboardList, Eye, MoreVertical } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { REQUEST_STATUS_MAP } from "./productionRequestHelpers";

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
  onViewRequest: (requestId: string) => void;
}

export function OwnerRequestsSection({ cropSeasonId, onViewRequest }: Props) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "">("");

  const requestsQuery = useOwnerListRequests(cropSeasonId, {
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  const requests = requestsQuery.data?.data.data ?? [];
  const meta = requestsQuery.data?.data.meta;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              Yêu cầu phê duyệt sản xuất
            </CardTitle>
            <CardDescription>
              {meta ? `${meta.totalItems} yêu cầu` : "Danh sách yêu cầu từ quản lý"}
            </CardDescription>
          </div>
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => {
              setStatusFilter(v === "all" ? "" : (v as typeof statusFilter));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {requestsQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ClipboardList className="h-7 w-7 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Không có yêu cầu nào{statusFilter ? " với trạng thái này" : ""}.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày gửi</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày phản hồi</TableHead>
                    <TableHead className="max-w-50">Mô tả</TableHead>
                    <TableHead className="w-12.5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req: ProductionRequestType) => {
                    const rs = REQUEST_STATUS_MAP[req.status] ?? {
                      label: req.status,
                      variant: "secondary" as const,
                    };
                    return (
                      <TableRow
                        key={req.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => onViewRequest(req.id)}
                      >
                        <TableCell className="text-sm">{formatDate(req.sentAt)}</TableCell>
                        <TableCell>
                          <Badge variant={rs.variant}>{rs.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(req.repliedAt)}</TableCell>
                        <TableCell className="text-sm max-w-50 truncate text-muted-foreground">
                          {req.description ?? "—"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onViewRequest(req.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Xem chi tiết
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
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
