import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useOwnerListRequests } from "@/queries/useCropSeason";
import {
  formatDate,
  REQUEST_STATUS_MAP,
} from "@/pages/ManagerPage/CropSeasons/components/helpers";
import ProductionRequestDetailPanel from "./ProductionRequestDetailPanel";

const STATUS_FILTERS: Array<{ value: "all" | "pending" | "approved" | "rejected"; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Đã từ chối" },
];

interface Props {
  cropSeasonId: string;
  /**
   * Optional: pre-select a request id (used for legacy deep-link redirect).
   */
  initialRequestId?: string;
}

/**
 * Owner-side requests tab.
 * - Lists production requests via useOwnerListRequests.
 * - Click a row → embeds ProductionRequestDetailPanel (compact mode) on the right
 *   so the owner can approve/reject without leaving the page.
 * - On a narrow viewport the detail replaces the list; on wide viewports both
 *   are visible side-by-side.
 */
export function OwnerRequestsHistoryTab({
  cropSeasonId,
  initialRequestId,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRequestId ?? null,
  );

  const query = useMemo(
    () => ({
      page: 1,
      limit: 50,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    }),
    [statusFilter],
  );

  const requestsQuery = useOwnerListRequests(cropSeasonId, query);
  const requests = requestsQuery.data?.data.data ?? [];

  // Auto-select the first pending request when loaded with no explicit selection
  useEffect(() => {
    if (selectedId || requestsQuery.isLoading) return;
    const firstPending = requests.find((r) => r.status === "pending");
    if (firstPending) {
      setSelectedId(firstPending.id);
    }
  }, [requests, requestsQuery.isLoading, selectedId]);

  return (
    <div className="flex gap-4 min-h-[420px]">
      <div
        className={`${
          selectedId ? "hidden lg:block lg:w-96 shrink-0" : "flex-1"
        } space-y-3`}
      >
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">Yêu cầu phê duyệt</h4>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as typeof statusFilter)
            }
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {requestsQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/20">
            <Inbox className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium">
              Không có yêu cầu nào
              {statusFilter !== "all" ? ` ở trạng thái này` : ""}
            </p>
          </div>
        ) : selectedId ? (
          // Compact list when a detail is selected
          <div className="space-y-1">
            {requests.map((r, index) => {
              const meta = REQUEST_STATUS_MAP[r.status] ?? {
                label: r.status,
                variant: "secondary" as const,
              };
              const isActive = r.id === selectedId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      Yêu cầu #{index + 1}
                    </span>
                    <Badge variant={meta.variant} className="text-[10px]">
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(r.sentAt)}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          // Full table when nothing is selected
          <div className="rounded-md border">
            <DataTable
              columns={
                [
                  {
                    accessorKey: "id",
                    header: "Mã",
                    cell: ({ row }) => (
                      <span className="font-mono text-xs">
                        #{row.original.id.slice(0, 8)}
                      </span>
                    ),
                  },
                  {
                    accessorKey: "sentAt",
                    header: "Ngày gửi",
                    cell: ({ row }) => (
                      <span className="text-sm">
                        {formatDate(row.original.sentAt)}
                      </span>
                    ),
                  },
                  {
                    accessorKey: "status",
                    header: "Trạng thái",
                    cell: ({ row }) => {
                      const meta = REQUEST_STATUS_MAP[row.original.status] ?? {
                        label: row.original.status,
                        variant: "secondary" as const,
                      };
                      return <Badge variant={meta.variant}>{meta.label}</Badge>;
                    },
                  },
                  {
                    accessorKey: "repliedAt",
                    header: "Ngày phản hồi",
                    cell: ({ row }) => (
                      <span className="text-sm text-muted-foreground">
                        {formatDate(row.original.repliedAt)}
                      </span>
                    ),
                  },
                ] as ColumnDef<(typeof requests)[number]>[]
              }
              data={requests}
              actions={[
                {
                  key: "view",
                  label: "Xem chi tiết",
                  icon: Eye,
                  onSelect: (r) => setSelectedId(r.id),
                },
              ]}
              onRowClick={(r) => setSelectedId(r.id)}
              emptyText="Không có yêu cầu nào."
            />
          </div>
        )}
      </div>

      {selectedId && (
        <div className="flex-1 min-w-0 border rounded-md p-4 bg-card">
          <ProductionRequestDetailPanel
            key={selectedId}
            requestId={selectedId}
            onBack={() => setSelectedId(null)}
            compact
          />
        </div>
      )}
    </div>
  );
}
