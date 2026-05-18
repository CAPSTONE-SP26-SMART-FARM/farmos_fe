import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { useAdminWithdrawalDetail } from "@/queries/useAdmin";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";
import AdminWithdrawalDetailPanel from "./AdminWithdrawalDetailPanel";

function AdminDoctorWithdrawalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const detailResult = useAdminWithdrawalDetail(id ?? "", !!id);
  const w = detailResult.data?.data;

  useDynamicBreadcrumb(
    `/dashboard/admin/doctor-withdrawals/${id}`,
    w ? `Yêu cầu - ${w.doctorName ?? "Bác sĩ"}` : undefined,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/admin/doctor-withdrawals")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>
      </div>

      <AdminWithdrawalDetailPanel withdrawalId={id ?? ""} />
    </div>
  );
}

export default AdminDoctorWithdrawalDetailPage;
