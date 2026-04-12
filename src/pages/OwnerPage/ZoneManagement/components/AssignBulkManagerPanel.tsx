import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import {
  useOwnerAssignBulkManagers,
  useOwnerListAvailableManagers,
} from "@/queries/useZone";
import { isApiErrorResponse } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  Loader2,
  Search,
  UserCog,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  zoneId: string;
  zoneName: string;
  onBack: () => void;
}

export default function AssignBulkManagerPanel({
  zoneId,
  zoneName,
  onBack,
}: Props) {
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const { data: managersData, isLoading: managersLoading } =
    useOwnerListAvailableManagers(zoneId, {
      page: 1,
      limit: 100,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    });

  const managers = managersData?.data.data ?? [];

  const bulkMutation = useOwnerAssignBulkManagers(zoneId);

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === managers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(managers.map((m) => m.id)));
    }
  };

  const handleAssignBulk = () => {
    if (selectedIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một quản lý.");
      return;
    }
    bulkMutation.mutate(
      { managerIds: Array.from(selectedIds) },
      {
        onSuccess: () => {
          toast.success(`Đã phân công thành công ${selectedIds.size} quản lý.`);
          handleBack();
        },
        onError: (error) => {
          if (isApiErrorResponse(error)) {
            toast.error(
              error.response?.data.message ??
                "Không thể phân công các quản lý.",
            );
          } else {
            toast.error("Đã xảy ra lỗi không mong muốn.");
          }
        },
      },
    );
  };

  const allSelected =
    managers.length > 0 && selectedIds.size === managers.length;

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
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
          <Badge className="mb-1">Phân công hàng loạt</Badge>
          <h1 className="text-2xl font-bold">
            Phân công quản lý cho {zoneName}
          </h1>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Chọn quản lý
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm quản lý..."
                className="pl-8 w-56"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {managersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-12 w-full"
                />
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
                Hãy thêm quản lý vào nông trại tại mục Quản lý nhân sự trước.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Button
                        variant={allSelected ? "default" : "outline"}
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={toggleAll}
                      >
                        {allSelected && <Check className="h-3 w-3" />}
                      </Button>
                    </TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map((m) => {
                    const isSelected = selectedIds.has(m.id);
                    return (
                      <TableRow
                        key={m.id}
                        className={`cursor-pointer ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                        onClick={() => toggleSelect(m.id)}
                      >
                        <TableCell>
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(m.id);
                            }}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {m.fullName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.phone ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {selectedIds.size > 0 && (
                <p className="text-sm text-muted-foreground">
                  Đã chọn {selectedIds.size} quản lý
                </p>
              )}
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Quản lý được phân công hàng loạt sẽ ở vai trò thành viên thường
            (không phải quản lý chính). Các quản lý đã được gán trước đó sẽ tự
            động được bỏ qua.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              Hủy
            </Button>
            <Button
              onClick={handleAssignBulk}
              disabled={selectedIds.size === 0 || bulkMutation.isPending}
              className="gap-1.5"
            >
              {bulkMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang phân công...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Phân công {selectedIds.size > 0 ? selectedIds.size : ""} quản
                  lý
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
