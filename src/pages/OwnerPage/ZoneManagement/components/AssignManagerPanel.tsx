import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { isApiErrorResponse } from "@/lib/utils";
import { useOwnerListFarmMembers } from "@/queries/useOwner";
import { useOwnerAssignManager } from "@/queries/useZone";
import { ArrowLeft, Loader2, Search, UserCog, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  zoneId: string;
  farmId: string;
  zoneName: string;
  onBack: () => void;
}

export default function AssignManagerPanel({
  zoneId,
  farmId,
  zoneName,
  onBack,
}: Props) {
  const [show, setShow] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const { data: membersData, isLoading: membersLoading } =
    useOwnerListFarmMembers({
      page,
      limit,
      role: "manager",
      farmId,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    });

  const managers = membersData?.data.data ?? [];
  const meta = membersData?.data.meta;

  const assignMutation = useOwnerAssignManager(zoneId);

  const handleAssign = () => {
    if (!selectedManagerId) {
      toast.error("Vui lòng chọn một quản lý.");
      return;
    }
    assignMutation.mutate(
      { managerId: selectedManagerId, isPrimary },
      {
        onSuccess: () => {
          toast.success("Đã phân công quản lý cho khu vực.");
          handleBack();
        },
        onError: (error) => {
          if (isApiErrorResponse(error)) {
            toast.error(
              error.response?.data.message ?? "Không thể phân công quản lý.",
            );
          } else {
            toast.error("Đã xảy ra lỗi không mong muốn.");
          }
        },
      },
    );
  };

  const selectedManager = managers.find((m) => m.user.id === selectedManagerId);

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
          <Badge className="mb-1">Phân công quản lý</Badge>
          <h1 className="text-2xl font-bold">Phân công quản lý cho {zoneName}</h1>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Chọn quản lý
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc email..."
                className="pl-8 w-56"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {membersLoading ? (
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
                {debouncedSearch
                  ? "Không có quản lý phù hợp. Hãy thử từ khóa khác."
                  : "Hãy thêm quản lý vào nông trại tại mục Quản lý nhân sự trước."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map((m) => {
                    const isSelected = selectedManagerId === m.user.id;
                    return (
                      <TableRow
                        key={m.user.id}
                        className={`cursor-pointer ${isSelected ? "bg-primary/10" : "hover:bg-muted/50"}`}
                        onClick={() => setSelectedManagerId(m.user.id)}
                      >
                        <TableCell className="font-medium">
                          {m.user.fullName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.user.email}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.user.phone ?? "—"}
                        </TableCell>
                        <TableCell>
                          {isSelected ? (
                            <Badge>Đã chọn</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedManagerId(m.user.id);
                              }}
                            >
                              Chọn
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {meta && meta.totalPages > 1 && (
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
            </>
          )}

          {/* Primary toggle */}
          {selectedManager && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="primary-select">Quản lý chính</Label>
                <Select
                  value={isPrimary ? "yes" : "no"}
                  onValueChange={(v) => setIsPrimary(v === "yes")}
                >
                  <SelectTrigger id="primary-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Không</SelectItem>
                    <SelectItem value="yes">Có - đặt làm quản lý chính</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Mỗi khu vực chỉ có một quản lý chính. Khi bật tùy chọn này,
                  quản lý chính hiện tại sẽ bị thay thế.
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              Hủy
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedManagerId || assignMutation.isPending}
              className="gap-1.5"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang phân công...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Phân công quản lý
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
