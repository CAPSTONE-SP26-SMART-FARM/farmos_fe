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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type PackageStatus = "Active" | "Draft";

type SubscriptionPackage = {
  id: string;
  name: string;
  durationMonths: number;
  iotKits: number;
  doctorTickets: number;
  priceVnd: number;
  description: string;
  status: PackageStatus;
  updatedAt: string;
};

const createPackage = (
  seed?: Partial<SubscriptionPackage>,
): SubscriptionPackage => ({
  id: seed?.id ?? crypto.randomUUID(),
  name: seed?.name ?? "",
  durationMonths: seed?.durationMonths ?? 12,
  iotKits: seed?.iotKits ?? 10,
  doctorTickets: seed?.doctorTickets ?? 20,
  priceVnd: seed?.priceVnd ?? 10_000_000,
  description: seed?.description ?? "",
  status: seed?.status ?? "Active",
  updatedAt: seed?.updatedAt ?? new Date().toISOString(),
});

const initialPackages: SubscriptionPackage[] = [
  createPackage({
    name: "Khởi động",
    durationMonths: 12,
    iotKits: 10,
    doctorTickets: 20,
    priceVnd: 9_900_000,
    description:
      "Gói khởi động cho quy mô nhỏ với 1 nông trại và tối đa 10 bộ IoT.",
    status: "Active",
  }),
  createPackage({
    name: "Tăng trưởng",
    durationMonths: 12,
    iotKits: 25,
    doctorTickets: 50,
    priceVnd: 19_900_000,
    description: "Gói tăng trưởng cho 2-3 nông trại, kèm nhiều vé tư vấn.",
    status: "Active",
  }),
  createPackage({
    name: "Mở rộng",
    durationMonths: 12,
    iotKits: 50,
    doctorTickets: 120,
    priceVnd: 39_900_000,
    description: "Gói quy mô lớn, phù hợp chủ đầu tư có nhiều khu trang trại.",
    status: "Draft",
  }),
];

const PACKAGE_STATUS_LABEL: Record<PackageStatus, string> = {
  Active: "Đang hoạt động",
  Draft: "Bản nháp",
};

const formatVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

function AdminPackagesPage() {
  const [packages, setPackages] =
    useState<SubscriptionPackage[]>(initialPackages);
  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] =
    useState<SubscriptionPackage>(createPackage());
  const [priceInput, setPriceInput] = useState<string>("9990000");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmState, setConfirmState] = useState<
    | { type: "delete"; id: string }
    | { type: "reset" }
    | { type: "update" }
    | null
  >(null);

  const isEditing = mode === "edit" && Boolean(editingId);
  const showForm = mode !== "idle";

  const totalRevenueVnd = useMemo(
    () => packages.reduce((acc, item) => acc + item.priceVnd, 0),
    [packages],
  );

  const resetForm = () => {
    setMode("create");
    const fresh = createPackage();
    setFormData(fresh);
    setPriceInput(String(fresh.priceVnd));
    setEditingId(null);
    setErrorMessage("");
  };

  const startCreate = () => {
    setMode("create");
    const fresh = createPackage();
    setFormData(fresh);
    setPriceInput(String(fresh.priceVnd));
    setEditingId(null);
    setErrorMessage("");
  };

  const startEdit = (pkg: SubscriptionPackage) => {
    setMode("edit");
    setEditingId(pkg.id);
    setFormData(pkg);
    setPriceInput(String(pkg.priceVnd));
    setErrorMessage("");
  };

  const deletePackage = (id: string) => {
    setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
    if (editingId === id) {
      setMode("idle");
      setEditingId(null);
      setFormData(createPackage());
      setPriceInput("0");
      setErrorMessage("");
    }
  };

  const parsePriceInput = (input: string): number => {
    const digits = input.replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Vui lòng nhập tên gói dịch vụ.";
    if (!formData.durationMonths || formData.durationMonths <= 0)
      return "Thời hạn (tháng) phải lớn hơn 0.";
    if (formData.iotKits < 0) return "Số bộ IoT không hợp lệ.";
    if (formData.doctorTickets < 0) return "Số vé bác sĩ không hợp lệ.";
    if (formData.priceVnd <= 0) return "Giá tiền VND phải lớn hơn 0.";
    return "";
  };

  const savePackage = () => {
    const error = validateForm();
    if (error) {
      setErrorMessage(error);
      return;
    }

    const payload: SubscriptionPackage = {
      ...formData,
      updatedAt: new Date().toISOString(),
    };

    if (isEditing && editingId) {
      setPackages((prev) =>
        prev.map((pkg) => (pkg.id === editingId ? payload : pkg)),
      );
    } else {
      setPackages((prev) => [payload, ...prev]);
    }

    setMode("idle");
    setEditingId(null);
    setFormData(createPackage());
    setPriceInput("0");
    setErrorMessage("");
  };

  const showResetButton = mode === "create" || mode === "edit";
  const showCreateButton = mode !== "create";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Cổng quản trị</Badge>
          <h1 className="text-2xl font-bold">Gói đăng ký</h1>
          <p className="text-muted-foreground">
            Quản lý gói đăng ký theo thời lượng, số bộ IoT, vé bác sĩ và giá
            VND.
          </p>
        </div>
        <div className="flex gap-2">
          {showResetButton && (
            <Button
              variant="outline"
              onClick={() => setConfirmState({ type: "reset" })}
            >
              Đặt lại biểu mẫu
            </Button>
          )}
          {showCreateButton && <Button onClick={startCreate}>Tạo gói</Button>}
          {showForm && (
            <Button
              onClick={() => {
                if (isEditing) {
                  setConfirmState({ type: "update" });
                } else {
                  savePackage();
                }
              }}
            >
              {isEditing ? "Cập nhật gói" : "Lưu gói"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle>Danh sách gói</CardTitle>
            <CardDescription>
              {packages.length} gói | Tổng giá niêm yết:{" "}
              {formatVnd(totalRevenueVnd)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr className="text-left">
                    <th className="p-3">Gói</th>
                    <th className="p-3">Thời hạn (tháng)</th>
                    <th className="p-3">Bộ IoT</th>
                    <th className="p-3">Vé bác sĩ</th>
                    <th className="p-3">Giá (VND)</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 w-12.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr
                      key={pkg.id}
                      className="border-t"
                    >
                      <td className="p-3">
                        <div className="font-medium">{pkg.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Cập nhật{" "}
                          {new Date(pkg.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">{pkg.durationMonths}</td>
                      <td className="p-3">{pkg.iotKits}</td>
                      <td className="p-3">{pkg.doctorTickets}</td>
                      <td className="p-3">{formatVnd(pkg.priceVnd)}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            pkg.status === "Active" ? "default" : "secondary"
                          }
                        >
                          {PACKAGE_STATUS_LABEL[pkg.status]}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEdit(pkg)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setConfirmState({ type: "delete", id: pkg.id })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>
                {isEditing ? "Cập nhật gói dịch vụ" : "Tạo gói dịch vụ mới"}
              </CardTitle>
              <CardDescription>
                Giá được tính bằng VND, phù hợp mô hình đăng ký theo gói.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Tên gói
                </p>
                <Input
                  placeholder="Tên gói (ví dụ: Khởi động, Tăng trưởng...)"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Thời hạn (tháng)
                </p>
                <Input
                  type="number"
                  min={1}
                  placeholder="Thời hạn (tháng)"
                  value={formData.durationMonths}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      durationMonths: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Số bộ IoT
                  </p>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Số bộ IoT"
                    value={formData.iotKits}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        iotKits: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Số vé bác sĩ
                  </p>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Số vé bác sĩ"
                    value={formData.doctorTickets}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        doctorTickets: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Giá (VND)
                </p>
                <Input
                  placeholder="Giá VND (chỉ nhập số, ví dụ: 19900000)"
                  value={priceInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setPriceInput(raw);
                    setFormData((prev) => ({
                      ...prev,
                      priceVnd: parsePriceInput(raw),
                    }));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Hiển thị: {formatVnd(formData.priceVnd || 0)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Trạng thái
                </p>
                <div className="flex gap-2 text-xs">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      formData.status === "Active" ? "default" : "outline"
                    }
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, status: "Active" }))
                    }
                  >
                    Đang hoạt động
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      formData.status === "Draft" ? "default" : "outline"
                    }
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, status: "Draft" }))
                    }
                  >
                    Bản nháp
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Mô tả
                </p>
                <Textarea
                  placeholder="Mô tả ngắn về gói dịch vụ"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-red-500">{errorMessage}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={confirmState?.type === "delete"}
        title="Xóa gói đăng ký?"
        description="Hành động này không thể hoàn tác. Chủ vườn hiện tại sẽ không còn thấy gói này."
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          if (confirmState?.type === "delete") {
            deletePackage(confirmState.id);
          }
          setConfirmState(null);
        }}
      />

      <ConfirmDialog
        open={confirmState?.type === "reset"}
        title="Đặt lại biểu mẫu gói dịch vụ?"
        description="Tất cả thay đổi chưa lưu trên biểu mẫu sẽ bị xóa."
        confirmLabel="Đặt lại"
        cancelLabel="Hủy"
        variant="destructive"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          resetForm();
          setConfirmState(null);
        }}
      />

      <ConfirmDialog
        open={confirmState?.type === "update"}
        title="Cập nhật thông tin gói?"
        description="Giá VND và hạn mức IoT/vé bác sĩ sẽ được áp dụng cho các đăng ký mới."
        confirmLabel="Cập nhật"
        cancelLabel="Hủy"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          savePackage();
          setConfirmState(null);
        }}
      />
    </div>
  );
}

export default AdminPackagesPage;
