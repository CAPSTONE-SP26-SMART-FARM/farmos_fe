import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserTable from "../UserManagement/UserTable";
import UserDetailPanel from "../UserManagement/UserDetailPanel";

const AdminUsersPage = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    undefined,
  );

  if (selectedUserId) {
    return (
      <UserDetailPanel
        id={selectedUserId}
        onBack={() => setSelectedUserId(undefined)}
      />
    );
  }

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
    </div>
  );
};

export default AdminUsersPage;
