import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserTable from "../UserManagement/UserTable";
import UserDetailPanel from "../UserManagement/UserDetailPanel";

const AdminUsersPage = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    undefined,
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="space-y-2">
        <Card>
          <CardHeader>
            <CardTitle>Quản lý người dùng</CardTitle>
            <CardDescription>
              Xem và quản lý toàn bộ tài khoản người dùng trên nền tảng.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserTable onViewDetail={(id) => setSelectedUserId(id)} />
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedUserId}
        onOpenChange={(open) => !open && setSelectedUserId(undefined)}
      >
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
            <DialogDescription>
              Xem thông tin chi tiết của tài khoản người dùng này.
            </DialogDescription>
          </DialogHeader>
          {selectedUserId && (
            <UserDetailPanel
              id={selectedUserId}
              onBack={() => setSelectedUserId(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
