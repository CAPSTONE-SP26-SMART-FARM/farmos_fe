import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

const createPackage = (seed?: Partial<SubscriptionPackage>): SubscriptionPackage => ({
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
    name: "Starter",
    durationMonths: 12,
    iotKits: 10,
    doctorTickets: 20,
    priceVnd: 9_900_000,
    description: "Goi khoi dong cho nho le voi 1 farm va toi da 10 bo IoT kits.",
    status: "Active",
  }),
  createPackage({
    name: "Growth",
    durationMonths: 12,
    iotKits: 25,
    doctorTickets: 50,
    priceVnd: 19_900_000,
    description: "Goi tang truong cho 2-3 farm, kem nhieu ticket tu van.",
    status: "Active",
  }),
  createPackage({
    name: "Scale",
    durationMonths: 12,
    iotKits: 50,
    doctorTickets: 120,
    priceVnd: 39_900_000,
    description: "Goi quy mo lon, phu hop chu dau tu co nhieu khu trang trai.",
    status: "Draft",
  }),
];

const formatVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

function AdminPackagesPage() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>(initialPackages);
  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SubscriptionPackage>(createPackage());
  const [priceInput, setPriceInput] = useState<string>("9990000");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmState, setConfirmState] = useState<
    | { type: "delete"; id: string }
    | { type: "reset" }
    | { type: "update" }
    | null
  >(null);
  const [isDirty, setIsDirty] = useState(false);

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
    setIsDirty(false);
  };

  const startCreate = () => {
    setMode("create");
    const fresh = createPackage();
    setFormData(fresh);
    setPriceInput(String(fresh.priceVnd));
    setEditingId(null);
    setErrorMessage("");
    setIsDirty(false);
  };

  const startEdit = (pkg: SubscriptionPackage) => {
    setMode("edit");
    setEditingId(pkg.id);
    setFormData(pkg);
    setPriceInput(String(pkg.priceVnd));
    setErrorMessage("");
    setIsDirty(false);
  };

  const deletePackage = (id: string) => {
    setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
    if (editingId === id) {
      setMode("idle");
      setEditingId(null);
      setFormData(createPackage());
      setPriceInput("0");
      setErrorMessage("");
      setIsDirty(false);
    }
  };

  const parsePriceInput = (input: string): number => {
    const digits = input.replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Vui long nhap ten goi dich vu.";
    if (!formData.durationMonths || formData.durationMonths <= 0)
      return "Thoi han (thang) phai lon hon 0.";
    if (formData.iotKits < 0) return "So IoT kits khong hop le.";
    if (formData.doctorTickets < 0) return "So doctor tickets khong hop le.";
    if (formData.priceVnd <= 0) return "Gia tien VND phai lon hon 0.";
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
    setIsDirty(false);
  };

  const showResetButton = mode === "create" || mode === "edit";
  const showCreateButton = mode !== "create";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Admin Portal</Badge>
          <h1 className="text-2xl font-bold">Subscription Packages</h1>
          <p className="text-muted-foreground">
            Quan ly goi dang ky theo thoi luong, so IoT kits, doctor tickets va gia VND.
          </p>
        </div>
        <div className="flex gap-2">
          {showResetButton && (
            <Button
              variant="outline"
              disabled={!isDirty}
              onClick={() => setConfirmState({ type: "reset" })}
            >
              Reset Form
            </Button>
          )}
          {showCreateButton && (
            <Button onClick={startCreate}>Create Package</Button>
          )}
          {showForm && (
            <Button
              onClick={() => {
                if (isEditing) {
                  setConfirmState({ type: "update" });
                } else {
                  savePackage();
                  setIsDirty(false);
                }
              }}
            >
              {isEditing ? "Update Package" : "Save Package"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle>Package List</CardTitle>
            <CardDescription>
              {packages.length} goi | Tong gia niem yet: {formatVnd(totalRevenueVnd)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr className="text-left">
                    <th className="p-3">Package</th>
                    <th className="p-3">Duration (months)</th>
                    <th className="p-3">IoT Kits</th>
                    <th className="p-3">Doctor Tickets</th>
                    <th className="p-3">Gia (VND)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="border-t">
                      <td className="p-3">
                        <div className="font-medium">{pkg.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Updated {new Date(pkg.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">{pkg.durationMonths}</td>
                      <td className="p-3">{pkg.iotKits}</td>
                      <td className="p-3">{pkg.doctorTickets}</td>
                      <td className="p-3">{formatVnd(pkg.priceVnd)}</td>
                      <td className="p-3">
                        <Badge variant={pkg.status === "Active" ? "default" : "secondary"}>
                          {pkg.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(pkg)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setConfirmState({ type: "delete", id: pkg.id })
                            }
                          >
                            Delete
                          </Button>
                        </div>
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
                {isEditing ? "Cap nhat goi dich vu" : "Tao goi dich vu moi"}
              </CardTitle>
              <CardDescription>
                Gia se duoc tinh bang VND, phu hop mo hinh subscription trong tai lieu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Ten goi</p>
                <Input
                  placeholder="Ten goi (vi du: Starter, Growth...)"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  onInput={() => setIsDirty(true)}
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Thoi han (thang)
                </p>
                <Input
                  type="number"
                  min={1}
                  placeholder="Thoi han (thang)"
                  value={formData.durationMonths}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      durationMonths: Number(e.target.value) || 0,
                    }))
                  }
                  onInput={() => setIsDirty(true)}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">So IoT kits</p>
                  <Input
                    type="number"
                    min={0}
                    placeholder="So IoT kits"
                    value={formData.iotKits}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        iotKits: Number(e.target.value) || 0,
                      }))
                    }
                  onInput={() => setIsDirty(true)}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    So doctor tickets
                  </p>
                  <Input
                    type="number"
                    min={0}
                    placeholder="So doctor tickets"
                    value={formData.doctorTickets}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        doctorTickets: Number(e.target.value) || 0,
                      }))
                    }
                  onInput={() => setIsDirty(true)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Gia (VND)</p>
                <Input
                  placeholder="Gia VND (chi nhap so, vd: 19900000)"
                  value={priceInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setPriceInput(raw);
                    setFormData((prev) => ({
                      ...prev,
                      priceVnd: parsePriceInput(raw),
                    }));
                  }}
                  onInput={() => setIsDirty(true)}
                />
                <p className="text-xs text-muted-foreground">
                  Hien thi: {formatVnd(formData.priceVnd || 0)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Trang thai</p>
                <div className="flex gap-2 text-xs">
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.status === "Active" ? "default" : "outline"}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, status: "Active" }))
                    }
                    disabled={formData.status === "Active"}
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.status === "Draft" ? "default" : "outline"}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, status: "Draft" }))
                    }
                    disabled={formData.status === "Draft"}
                  >
                    Draft
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Mo ta</p>
                <Textarea
                  placeholder="Mo ta ngan ve goi dich vu"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  onInput={() => setIsDirty(true)}
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
        title="Xoa goi subscription?"
        description="Hanh dong nay khong the hoan tac. Owner hien tai se khong con thay duoc goi nay."
        confirmLabel="Delete"
        cancelLabel="Cancel"
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
        title="Reset form goi dich vu?"
        description="Tat ca thay doi chua luu tren form se bi xoa."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        variant="destructive"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          resetForm();
          setConfirmState(null);
        }}
      />

      <ConfirmDialog
        open={confirmState?.type === "update"}
        title="Cap nhat thong tin goi?"
        description="Gia VND va quota IoT/Doctor tickets se duoc ap dung cho cac dang ky moi."
        confirmLabel="Update"
        cancelLabel="Cancel"
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
