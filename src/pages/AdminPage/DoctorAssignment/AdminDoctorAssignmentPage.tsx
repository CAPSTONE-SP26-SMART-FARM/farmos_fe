import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ListAssignmentDoctor from "../AssignmentDoctor/ListAssignmentDoctor";
import AssignDoctorDialog from "../AssignmentDoctor/AssignDoctorDialog";

function AdminDoctorAssignmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Cổng quản trị</Badge>
          <h1 className="text-2xl font-bold">Phân công bác sĩ</h1>
          <p className="text-muted-foreground">
            Gán bác sĩ cho chủ vườn/nông trại và theo dõi phân bổ nguồn lực.
          </p>
        </div>
        <AssignDoctorDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ma trận phân công</CardTitle>
          <CardDescription>Danh sách gán bác sĩ cho chủ vườn.</CardDescription>
        </CardHeader>
        <CardContent>
          <ListAssignmentDoctor />
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDoctorAssignmentPage;
