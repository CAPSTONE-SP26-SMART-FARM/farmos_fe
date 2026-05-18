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
import { useState } from "react";
import FarmTable from "./FarmTable";
import FarmDetailPanel from "./FarmDetailPanel";

const AdminFarmsPage = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | undefined>(
    undefined,
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="space-y-2">
        <Card>
          <CardHeader>
            <CardTitle>Quản lý trang trại</CardTitle>
            <CardDescription>
              Xem và quản lý toàn bộ trang trại trên nền tảng.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FarmTable onViewDetail={(id) => setSelectedFarmId(id)} />
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedFarmId}
        onOpenChange={(open) => !open && setSelectedFarmId(undefined)}
      >
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết trang trại</DialogTitle>
            <DialogDescription>
              Xem thông tin chi tiết của trang trại này.
            </DialogDescription>
          </DialogHeader>
          {selectedFarmId && (
            <FarmDetailPanel
              id={selectedFarmId}
              onBack={() => setSelectedFarmId(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFarmsPage;
