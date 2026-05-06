import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useDebounce from "@/hooks/useDebounce";
import { isApiErrorResponse } from "@/lib/utils";
import {
  useOwnerAssignBulkManagers,
  useOwnerAssignManager,
  useOwnerListAvailableManagers,
} from "@/queries/useZone";
import { Check, Loader2, Search, UserCog, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  mode: "single" | "bulk";
  zoneId: string;
  zoneName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AssignManagerDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {props.mode === "single" ? (
              <UserPlus className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5" />
            )}
            {props.mode === "single"
              ? `Phân công quản lý cho ${props.zoneName}`
              : `Phân công hàng loạt cho ${props.zoneName}`}
          </DialogTitle>
          <DialogDescription>
            {props.mode === "single"
              ? "Chọn một quản lý để phân công cho khu vực này."
              : "Chọn nhiều quản lý để phân công cùng lúc."}
          </DialogDescription>
        </DialogHeader>

        {/* Re-mount on open so internal state resets */}
        {props.open && (
          <AssignBody
            mode={props.mode}
            zoneId={props.zoneId}
            onClose={() => props.onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssignBody({
  mode,
  zoneId,
  onClose,
}: {
  mode: "single" | "bulk";
  zoneId: string;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedSingle, setSelectedSingle] = useState("");
  const [selectedBulk, setSelectedBulk] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const limit = mode === "single" ? 10 : 100;
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useOwnerListAvailableManagers(zoneId, {
    page: mode === "single" ? page : 1,
    limit,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const managers = data?.data.data ?? [];
  const meta = data?.data.meta;

  const singleMutation = useOwnerAssignManager(zoneId);
  const bulkMutation = useOwnerAssignBulkManagers(zoneId);
  const isPending = singleMutation.isPending || bulkMutation.isPending;

  const allSelected =
    managers.length > 0 && selectedBulk.size === managers.length;

  const toggleBulk = (id: string) =>
    setSelectedBulk((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (allSelected) {
      setSelectedBulk(new Set());
    } else {
      setSelectedBulk(new Set(managers.map((m) => m.id)));
    }
  };

  const handleAssign = () => {
    if (mode === "single") {
      if (!selectedSingle) {
        toast.error("Vui lòng chọn một quản lý.");
        return;
      }
      singleMutation.mutate(
        { managerId: selectedSingle },
        {
          onSuccess: () => {
            toast.success("Đã phân công quản lý cho khu vực.");
            onClose();
          },
          onError: (error) => {
            const msg = isApiErrorResponse(error)
              ? (error.response?.data.message ?? "Không thể phân công quản lý.")
              : "Đã xảy ra lỗi không mong muốn.";
            toast.error(msg);
          },
        },
      );
    } else {
      if (selectedBulk.size === 0) {
        toast.error("Vui lòng chọn ít nhất một quản lý.");
        return;
      }
      bulkMutation.mutate(
        { managerIds: Array.from(selectedBulk) },
        {
          onSuccess: () => {
            toast.success(`Đã phân công thành công ${selectedBulk.size} quản lý.`);
            onClose();
          },
          onError: (error) => {
            const msg = isApiErrorResponse(error)
              ? (error.response?.data.message ?? "Không thể phân công hàng loạt.")
              : "Đã xảy ra lỗi không mong muốn.";
            toast.error(msg);
          },
        },
      );
    }
  };

  // Reset bulk selection when search changes (rows change)
  useEffect(() => {
    if (mode === "bulk") setSelectedBulk(new Set());
  }, [debouncedSearch, mode]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên hoặc email..."
          className="pl-8"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : managers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <UserCog className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">
            Không có quản lý khả dụng
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {debouncedSearch
              ? "Không có quản lý phù hợp. Hãy thử từ khóa khác."
              : "Hãy thêm quản lý vào nông trại tại mục Quản lý nhân sự trước."}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {mode === "bulk" && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4"
                  />
                </TableHead>
              )}
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Số điện thoại</TableHead>
              {mode === "single" && <TableHead className="w-20"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {managers.map((m) => {
              const isSel =
                mode === "single"
                  ? selectedSingle === m.id
                  : selectedBulk.has(m.id);
              return (
                <TableRow
                  key={m.id}
                  className={`cursor-pointer ${isSel ? "bg-primary/10" : "hover:bg-muted/50"}`}
                  onClick={() =>
                    mode === "single"
                      ? setSelectedSingle(m.id)
                      : toggleBulk(m.id)
                  }
                >
                  {mode === "bulk" && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleBulk(m.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4"
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{m.fullName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.email}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.phone ?? "—"}
                  </TableCell>
                  {mode === "single" && (
                    <TableCell>
                      {isSel ? (
                        <Badge>Đã chọn</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSingle(m.id);
                          }}
                        >
                          Chọn
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {mode === "single" && meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Trang {meta.page}/{meta.totalPages} &bull; {meta.totalItems} quản lý
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {mode === "bulk" && selectedBulk.size > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-primary" />
          Đã chọn {selectedBulk.size} quản lý
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Hủy
        </Button>
        <Button
          onClick={handleAssign}
          disabled={
            isPending ||
            (mode === "single" ? !selectedSingle : selectedBulk.size === 0)
          }
          className="gap-1.5"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang phân công...
            </>
          ) : mode === "single" ? (
            <>
              <UserPlus className="h-4 w-4" />
              Phân công
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              Phân công {selectedBulk.size} quản lý
            </>
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}
