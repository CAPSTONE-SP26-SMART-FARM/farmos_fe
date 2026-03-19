import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import FarmTable from "./FarmManagement/FarmTable";
import FarmDetailPanel from "./FarmManagement/FarmDetailPanel";

const AdminFarmsPage = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | undefined>(
    undefined,
  );

  if (selectedFarmId) {
    return (
      <FarmDetailPanel
        id={selectedFarmId}
        onBack={() => setSelectedFarmId(undefined)}
      />
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="space-y-2">
        <Card>
          <CardHeader>
            <CardTitle>Farm Management</CardTitle>
            <CardDescription>
              View and manage all farms on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FarmTable onViewDetail={(id) => setSelectedFarmId(id)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminFarmsPage;
