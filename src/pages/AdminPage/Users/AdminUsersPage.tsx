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
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View and manage all user accounts on the platform.
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
