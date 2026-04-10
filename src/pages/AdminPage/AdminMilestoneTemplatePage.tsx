import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import { MoreVertical, Pencil, Trash2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAdminListMilestoneTemplates,
  useAdminCreateMilestoneTemplate,
  useAdminUpdateMilestoneTemplate,
  useAdminDeleteMilestoneTemplate,
} from "@/queries/useAdmin";
import type {
  MilestoneTemplateResType,
  MilestoneTemplateItemInputType,
  FarmTypeType,
} from "@/schemaValidatation/milestoneTemplate";
import useDebounce from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================
// Types
// ============================================================

type FormItem = MilestoneTemplateItemInputType & { _key: string };

type FormState = {
  name: string;
  description: string;
  farmType: FarmTypeType;
  isActive: boolean;
  items: FormItem[];
};

type ConfirmState =
  | { type: "delete"; id: string }
  | { type: "update" }
  | { type: "reset" }
  | null;

// ============================================================
// Helpers
// ============================================================

const FARM_TYPE_LABELS: Record<FarmTypeType, string> = {
  cultivation: "Cultivation",
};

const emptyItem = (): FormItem => ({
  _key: crypto.randomUUID(),
  stageName: "",
  milestoneOrder: 1,
  daysBetween: null,
});

const defaultForm = (): FormState => ({
  name: "",
  description: "",
  farmType: "cultivation",
  isActive: true,
  items: [emptyItem()],
});

const templateToForm = (t: MilestoneTemplateResType): FormState => ({
  name: t.name,
  description: t.description ?? "",
  farmType: t.farmType,
  isActive: t.isActive,
  items: t.items
    .slice()
    .sort((a, b) => a.milestoneOrder - b.milestoneOrder)
    .map((item) => ({
      _key: item.id,
      stageName: item.stageName,
      milestoneOrder: item.milestoneOrder,
      daysBetween: item.daysBetween,
    })),
});

// ============================================================
// Item Row
// ============================================================

const ItemRow = ({
  item,
  index,
  canRemove,
  onChange,
  onRemove,
  orderError,
}: {
  item: FormItem;
  index: number;
  canRemove: boolean;
  onChange: (key: string, field: keyof FormItem, value: unknown) => void;
  onRemove: (key: string) => void;
  orderError: boolean;
}) => (
  <div className="rounded-md border p-3 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-muted-foreground">
        Stage #{index + 1}
      </span>
      <Button
        size="sm"
        variant="ghost"
        disabled={!canRemove}
        onClick={() => onRemove(item._key)}
        className="h-7 w-7 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
    <div className="grid gap-3 md:grid-cols-3">
      <div className="md:col-span-1">
        <Input
          placeholder="Stage name *"
          value={item.stageName}
          onChange={(e) => onChange(item._key, "stageName", e.target.value)}
        />
      </div>
      <div>
        <Input
          type="number"
          min={1}
          placeholder="Order *"
          value={item.milestoneOrder}
          onChange={(e) =>
            onChange(item._key, "milestoneOrder", Number(e.target.value))
          }
          className={orderError ? "border-destructive" : ""}
        />
        {orderError && (
          <p className="mt-1 text-xs text-destructive">Duplicate order</p>
        )}
      </div>
      <div>
        <Input
          type="number"
          min={0}
          placeholder="Days between (optional)"
          value={item.daysBetween ?? ""}
          onChange={(e) =>
            onChange(
              item._key,
              "daysBetween",
              e.target.value === "" ? null : Number(e.target.value),
            )
          }
        />
      </div>
    </div>
  </div>
);

// ============================================================
// Main Page
// ============================================================

const AdminMilestoneTemplatePage = () => {
  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 500);

  const listQuery = useAdminListMilestoneTemplates({
    page,
    limit: 8,
    search: debouncedSearch || undefined,
  });

  const createMutation = useAdminCreateMilestoneTemplate();
  const updateMutation = useAdminUpdateMilestoneTemplate();
  const deleteMutation = useAdminDeleteMilestoneTemplate();

  const templates = listQuery.data?.data.data ?? [];
  const totalPages = listQuery.data?.data.meta.totalPages ?? 1;
  const totalItems = listQuery.data?.data.meta.totalItems ?? 0;

  const showForm = mode !== "idle";
  const isEditing = mode === "edit";

  // ---- Form helpers ----

  const startCreate = () => {
    setForm(defaultForm());
    setEditingId(null);
    setMode("create");
  };

  const startEdit = (t: MilestoneTemplateResType) => {
    setForm(templateToForm(t));
    setEditingId(t.id);
    setMode("edit");
  };

  const cancelForm = () => {
    setMode("idle");
    setEditingId(null);
    setForm(defaultForm());
  };

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateItem = (itemKey: string, field: keyof FormItem, value: unknown) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item._key === itemKey ? { ...item, [field]: value } : item,
      ),
    }));

  const addItem = () =>
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          ...emptyItem(),
          milestoneOrder:
            Math.max(0, ...prev.items.map((i) => i.milestoneOrder)) + 1,
        },
      ],
    }));

  const removeItem = (key: string) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i._key !== key),
    }));

  // ---- Validation ----

  const duplicateOrders = (() => {
    const seen = new Set<number>();
    const dups = new Set<number>();
    form.items.forEach((i) => {
      if (seen.has(i.milestoneOrder)) dups.add(i.milestoneOrder);
      seen.add(i.milestoneOrder);
    });
    return dups;
  })();

  const validate = (): string | null => {
    if (!form.name.trim()) return "Template name is required.";
    if (!form.items.length) return "At least 1 milestone stage is required.";
    if (form.items.some((i) => !i.stageName.trim()))
      return "All stages must have a name.";
    if (duplicateOrders.size > 0)
      return "Milestone order must be unique across all stages.";
    return null;
  };

  // ---- Save ----

  const doSave = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      type: "crop_season" as const,
      farmType: form.farmType,
      isActive: form.isActive,
      items: form.items.map(({ _key: _k, ...rest }) => rest),
    };

    if (isEditing && editingId) {
      updateMutation.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast.success("Template updated.");
            cancelForm();
          },
          onError: (e: unknown) => {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Update failed.");
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Template created.");
          cancelForm();
        },
        onError: (e: unknown) => {
          const err = e as { response?: { data?: { message?: string } } };
          toast.error(err?.response?.data?.message ?? "Create failed.");
        },
      });
    }
  };

  const doDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Template deleted.");
        if (editingId === id) cancelForm();
      },
      onError: (e: unknown) => {
        const err = e as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message ?? "Delete failed.");
      },
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Milestone Templates</h1>
          <p className="text-muted-foreground text-sm">
            Define crop season milestone presets. Managers use these when
            planning crop seasons.
          </p>
        </div>
        <div className="flex gap-2">
          {showForm && (
            <Button variant="outline" onClick={() => setConfirmState({ type: "reset" })}>
              Cancel
            </Button>
          )}
          {!showForm && (
            <Button onClick={startCreate}>
              <Plus className="h-4 w-4 mr-1" />
              New Template
            </Button>
          )}
          {showForm && (
            <Button onClick={() => isEditing ? setConfirmState({ type: "update" }) : doSave()} disabled={isSaving}>
              {isSaving ? "Saving..." : isEditing ? "Update" : "Save"}
            </Button>
          )}
        </div>
      </div>

      <div className={`grid gap-4 ${showForm ? "lg:grid-cols-5" : "lg:grid-cols-1"}`}>
        {/* List */}
        <Card className={showForm ? "lg:col-span-2" : ""}>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>{totalItems} template(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />

            {listQuery.isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No templates found.
              </p>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-md border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      editingId === t.id ? "border-primary bg-muted/30" : ""
                    }`}
                    onClick={() => startEdit(t)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{t.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs capitalize">
                            {FARM_TYPE_LABELS[t.farmType]}
                          </Badge>
                          <Badge
                            variant={t.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {t.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {t.items.length} stage(s)
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startEdit(t); }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmState({ type: "delete", id: t.id });
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                <span>Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Prev
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form */}
        {showForm && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>{isEditing ? "Edit Template" : "New Template"}</CardTitle>
              <CardDescription>
                Define the milestone stages for this crop season template.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic info */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Template name *"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </div>
                <Select
                  value={form.farmType}
                  onValueChange={(v) => updateField("farmType", v as FarmTypeType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Farm type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cultivation">Cultivation</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={form.isActive ? "true" : "false"}
                  onValueChange={(v) => updateField("isActive", v === "true")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={2}
              />

              <Separator />

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Milestone Stages ({form.items.length})
                  </p>
                  <Button size="sm" variant="outline" onClick={addItem}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Stage
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Order must be unique. Days between = days after previous stage starts.
                </p>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {form.items.map((item, index) => (
                    <ItemRow
                      key={item._key}
                      item={item}
                      index={index}
                      canRemove={form.items.length > 1}
                      onChange={updateItem}
                      onRemove={removeItem}
                      orderError={duplicateOrders.has(item.milestoneOrder)}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmState?.type === "delete"}
        title="Delete template?"
        description="This action cannot be undone. The template will be soft-deleted."
        confirmLabel="Delete"
        variant="destructive"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          if (confirmState?.type === "delete") doDelete(confirmState.id);
          setConfirmState(null);
        }}
      />
      <ConfirmDialog
        open={confirmState?.type === "reset"}
        title="Discard changes?"
        description="All unsaved changes will be lost."
        confirmLabel="Discard"
        variant="destructive"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => { cancelForm(); setConfirmState(null); }}
      />
      <ConfirmDialog
        open={confirmState?.type === "update"}
        title="Update template?"
        description="This will overwrite all existing milestone stages."
        confirmLabel="Update"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => { doSave(); setConfirmState(null); }}
      />
    </div>
  );
};

export default AdminMilestoneTemplatePage;
