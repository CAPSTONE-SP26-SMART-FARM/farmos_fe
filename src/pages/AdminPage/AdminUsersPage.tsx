import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";

type UserStatus = "Active" | "Inactive";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "Admin" | "Owner" | "Manager" | "Farmer" | "Doctor";
  status: UserStatus;
};

const createUser = (seed?: Partial<AdminUser>): AdminUser => ({
  id: seed?.id ?? crypto.randomUUID(),
  name: seed?.name ?? "",
  email: seed?.email ?? "",
  password: seed?.password ?? "123456@",
  role: seed?.role ?? "Owner",
  status: seed?.status ?? "Active",
});

const initialUsers: AdminUser[] = [
  createUser({
    name: "Admin Root",
    email: "admin@farmos.local",
    role: "Admin",
    status: "Active",
  }),
  createUser({
    name: "Owner Demo",
    email: "owner@farmos.local",
    role: "Owner",
    status: "Active",
  }),
  createUser({
    name: "Manager Demo",
    email: "manager@farmos.local",
    role: "Manager",
    status: "Active",
  }),
  createUser({
    name: "Doctor Demo",
    email: "doctor@farmos.local",
    role: "Doctor",
    status: "Inactive",
  }),
];

type DialogMode = "none" | "create" | "edit-status";

function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [dialogMode, setDialogMode] = useState<DialogMode>("none");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [createForm, setCreateForm] = useState<AdminUser>(
    createUser({ role: "Owner" }),
  );
  const [statusDraft, setStatusDraft] = useState<UserStatus>("Active");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmState, setConfirmState] = useState<{ type: "create" | "update" } | null>(
    null,
  );

  const openCreateDialog = () => {
    setCreateForm(createUser({ role: "Owner" }));
    setErrorMessage("");
    setDialogMode("create");
  };

  const openEditStatusDialog = (user: AdminUser) => {
    setEditingUser(user);
    setStatusDraft(user.status);
    setDialogMode("edit-status");
  };

  const closeDialog = () => {
    setDialogMode("none");
    setEditingUser(null);
    setErrorMessage("");
    setConfirmState(null);
  };

  const handleCreate = () => {
    if (!createForm.name.trim()) {
      setErrorMessage("Vui long nhap ten nguoi dung.");
      return;
    }
    if (!createForm.email.trim()) {
      setErrorMessage("Vui long nhap email.");
      return;
    }

    setUsers((prev) => [createForm, ...prev]);
    closeDialog();
  };

  const handleUpdateStatus = () => {
    if (!editingUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              status: statusDraft,
            }
          : u,
      ),
    );
    closeDialog();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Admin Portal</Badge>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Quan ly tai khoan nguoi dung theo role va trang thai hoat dong.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export</Button>
          <Button onClick={openCreateDialog}>Create User</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            Danh sach tai khoan theo role va trang thai hoat dong.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr className="text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.role}</td>
                    <td className="p-3">
                      <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditStatusDialog(user)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit User Dialog */}
      {(dialogMode === "create" || (dialogMode === "edit-status" && editingUser)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>
                {dialogMode === "create" ? "Tao tai khoan moi" : "Chinh sua tai khoan"}
              </CardTitle>
              <CardDescription>
                {dialogMode === "create"
                  ? "Admin tao tai khoan voi role tuong ung, status mac dinh la Active."
                  : "Chi duoc phep thay doi role va trang thai Active / Inactive cua tai khoan."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Ten day du</p>
                <Input
                  placeholder="Ho ten"
                  value={dialogMode === "create" ? createForm.name : editingUser?.name ?? ""}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={dialogMode === "edit-status"}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <Input
                  placeholder="Email"
                  value={dialogMode === "create" ? createForm.email : editingUser?.email ?? ""}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  disabled={dialogMode === "edit-status"}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Password</p>
                <Input
                  type="password"
                  placeholder="Mat khau dang nhap (mac dinh 123456@)"
                  value={
                    dialogMode === "create"
                      ? createForm.password
                      : editingUser?.password ?? "********"
                  }
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  disabled={dialogMode === "edit-status"}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Role</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(["Admin", "Owner", "Manager", "Farmer", "Doctor"] as const).map(
                    (role) => (
                      <Button
                        key={role}
                        type="button"
                        size="sm"
                        variant={
                          (dialogMode === "create"
                            ? createForm.role
                            : editingUser?.role) === role
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          dialogMode === "create"
                            ? setCreateForm((prev) => ({ ...prev, role: role }))
                            : setEditingUser((prev) =>
                                prev ? { ...prev, role: role } : prev,
                              )
                        }
                      >
                        {role}
                      </Button>
                    ),
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <div className="flex gap-2 text-xs">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      (dialogMode === "create"
                        ? createForm.status
                        : statusDraft) === "Active"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      dialogMode === "create"
                        ? setCreateForm((prev) => ({ ...prev, status: "Active" }))
                        : setStatusDraft("Active")
                    }
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      (dialogMode === "create"
                        ? createForm.status
                        : statusDraft) === "Inactive"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      dialogMode === "create"
                        ? setCreateForm((prev) => ({ ...prev, status: "Inactive" }))
                        : setStatusDraft("Inactive")
                    }
                  >
                    Inactive
                  </Button>
                </div>
              </div>
              {errorMessage && (
                <p className="text-xs text-red-500">{errorMessage}</p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  setConfirmState({
                    type: dialogMode === "create" ? "create" : "update",
                  })
                }
              >
                {dialogMode === "create" ? "Create" : "Save"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Confirms for create / update */}
      <ConfirmDialog
        open={confirmState?.type === "create"}
        title="Tao tai khoan moi?"
        description="Tai khoan moi se duoc tao va co the su dung de dang nhap he thong."
        confirmLabel="Create"
        cancelLabel="Cancel"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          handleCreate();
          setConfirmState(null);
        }}
      />

      <ConfirmDialog
        open={confirmState?.type === "update"}
        title="Cap nhat trang thai tai khoan?"
        description="Nguoi dung se duoc bat/tat quyen truy cap theo trang thai moi."
        confirmLabel="Update"
        cancelLabel="Cancel"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          handleUpdateStatus();
          setConfirmState(null);
        }}
      />
    </div>
  );
}

export default AdminUsersPage;
