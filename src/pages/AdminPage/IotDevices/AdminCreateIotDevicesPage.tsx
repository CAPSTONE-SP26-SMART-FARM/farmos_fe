import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import {
  useAdminDeleteIotDevice,
} from "@/queries/useIotDevice";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";
import AdminIotDeviceForm from "./_components/admin-form/AdminIotDeviceForm";
import { StepIndicator } from "./_components/create/StepIndicator";
import { EditBoardStep } from "./_components/create/EditBoardStep";
import { SensorStep } from "./_components/create/SensorStep";
import { CancelBatchAlert } from "./_components/create/CancelBatchAlert";

export default function AdminCreateIotDevicesPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [createdDevices, setCreatedDevices] = useState<IotDeviceResType[]>([]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const deleteMutation = useAdminDeleteIotDevice();

  const board = useMemo(
    () => createdDevices.find((d) => d.deviceType === "board_module"),
    [createdDevices],
  );

  const goToList = () => navigate("/dashboard/admin/iot-devices");

  // Cancel batch: xóa tuần tự từng device. Không atomic — đã được cảnh báo
  // trong CancelBatchAlert description.
  const doCancelBatch = async () => {
    try {
      for (const d of createdDevices) {
        await deleteMutation.mutateAsync(d.id);
      }
      setConfirmCancel(false);
      goToList();
    } catch {
      setConfirmCancel(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="space-y-2">
          <Badge>Cổng quản trị</Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Tạo bộ thiết bị IoT
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Bước 1: tạo lô thiết bị. Bước 2: gắn cảm biến cho vi xử lý.
          </p>
        </div>

        <StepIndicator step={step} />
      </section>

      {step === 1 ? (
        createdDevices.length === 0 ? (
          <AdminIotDeviceForm
            onBack={goToList}
            hideStatus
            onCreated={(devices) => {
              setCreatedDevices(devices);
              setStep(2);
            }}
          />
        ) : board ? (
          <EditBoardStep
            boardId={board.id}
            fallback={board}
            onBack={() => setConfirmCancel(true)}
            onNext={() => setStep(2)}
          />
        ) : null
      ) : (
        <SensorStep
          board={board}
          onGoBack={() => setStep(1)}
          onDone={goToList}
        />
      )}

      <CancelBatchAlert
        open={confirmCancel}
        count={createdDevices.length}
        isPending={deleteMutation.isPending}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => void doCancelBatch()}
      />
    </div>
  );
}
