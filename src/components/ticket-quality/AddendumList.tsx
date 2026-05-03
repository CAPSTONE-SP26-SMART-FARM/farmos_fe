import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ADDENDUM_TYPE_LABEL } from "@/constants/ticketQualityLabels";
import type {
  AddendumResType,
  AddendumTypeType,
} from "@/schemaValidatation/addendum";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { AlertTriangle, FileText, Pencil, Pill } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AddendumListProps {
  addenda: AddendumResType[];
}

// Card hiển thị các ghi chú thêm sau khi giải pháp đã chốt — không sửa
// được nội dung gốc, chỉ append (BR-73).

const TYPE_ICON: Record<AddendumTypeType, LucideIcon> = {
  SOLUTION_NOTE: Pencil,
  PRESCRIPTION_NOTE: Pill,
  CORRECTION: AlertTriangle,
};

const TYPE_DOT_CLASS: Record<AddendumTypeType, string> = {
  SOLUTION_NOTE: "bg-emerald-600",
  PRESCRIPTION_NOTE: "bg-cyan-600",
  CORRECTION: "bg-amber-600",
};

export default function AddendumList({ addenda }: AddendumListProps) {
  // Sort theo thời gian tăng dần — kể chuyện tự nhiên.
  const sorted = [...addenda].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Ghi chú bổ sung
          {sorted.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-auto"
            >
              {sorted.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Các ghi chú thêm sau khi giải pháp đã chốt — không sửa được nội
          dung gốc.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Chưa có ghi chú bổ sung nào.
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((item) => {
              const Icon = TYPE_ICON[item.type];
              return (
                <div
                  key={item.id}
                  className="flex gap-3"
                >
                  <div className="flex flex-col items-center pt-1">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${TYPE_DOT_CLASS[item.type]}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">
                        {ADDENDUM_TYPE_LABEL[item.type]}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(item.createdAt),
                          "HH:mm dd/MM/yyyy",
                          { locale: vi },
                        )}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap rounded-md border bg-muted/30 p-2.5">
                      {item.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
