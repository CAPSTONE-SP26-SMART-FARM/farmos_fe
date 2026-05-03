import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/common/EmptyState";
import type { SolutionResType } from "@/schemaValidatation/solution";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { AlertCircle, Bot, ClipboardList, Stethoscope } from "lucide-react";

interface SolutionViewCardProps {
  solution: SolutionResType | null;
}

// Card hiển thị 4 trường giải pháp do bác sĩ ghi sau khi xử lý ticket.
// Read-only — bổ sung phải qua TicketAddendum.

const FIELD_DEF: Array<{
  key: keyof Pick<
    SolutionResType,
    "rootCause" | "rootCauseReason" | "treatment" | "prevention"
  >;
  label: string;
}> = [
  { key: "rootCause", label: "Vấn đề gốc rễ" },
  { key: "rootCauseReason", label: "Nguyên nhân vì sao xảy ra" },
  { key: "treatment", label: "Cách giải quyết" },
  { key: "prevention", label: "Cách phòng tránh tái phát" },
];

export default function SolutionViewCard({ solution }: SolutionViewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4" />
          Giải pháp
        </CardTitle>
        <CardDescription>
          Bốn trường giải pháp do bác sĩ ghi sau khi xử lý ticket — vấn đề
          gốc, nguyên nhân, cách điều trị và phòng tránh.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!solution ? (
          <EmptyState
            icon={ClipboardList}
            title="Chưa có giải pháp"
            description="Giải pháp sẽ xuất hiện sau khi bác sĩ hoàn tất xử lý ticket."
          />
        ) : (
          <div className="space-y-4">
            {/* Source badge + thời điểm */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {solution.source === "AI" ? (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-700 border-amber-200 gap-1"
                >
                  <Bot className="h-3 w-3" />
                  Xử lý bởi AI
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-700 border-emerald-200 gap-1"
                >
                  <Stethoscope className="h-3 w-3" />
                  Bác sĩ
                </Badge>
              )}
              <span>·</span>
              <span>
                Ghi lúc{" "}
                {format(new Date(solution.createdAt), "HH:mm dd/MM/yyyy", {
                  locale: vi,
                })}
              </span>
              {solution.language && solution.language !== "vi" && (
                <>
                  <span>·</span>
                  <span>Ngôn ngữ: {solution.language}</span>
                </>
              )}
            </div>

            {/* Severity note (optional) */}
            {solution.severityNote && (
              <div className="flex items-start gap-2 rounded-md border bg-amber-500/10 border-amber-200 p-3 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-900 mb-0.5">
                    Lưu ý mức độ
                  </p>
                  <p className="text-amber-900/80 whitespace-pre-wrap">
                    {solution.severityNote}
                  </p>
                </div>
              </div>
            )}

            {/* 4 trường */}
            <div className="space-y-3">
              {FIELD_DEF.map((field) => (
                <div
                  key={field.key}
                  className="space-y-1"
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {field.label}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
                    {solution[field.key]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
