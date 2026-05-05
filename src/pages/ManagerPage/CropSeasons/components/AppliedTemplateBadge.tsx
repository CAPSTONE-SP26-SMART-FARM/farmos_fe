import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppliedTemplateInfo } from "@/queries/useSeasonTemplate";
import { Sparkles } from "lucide-react";

interface Props {
  cropSeasonId: string;
}

// Hiển thị badge "Tạo từ mẫu X v?" (BR-115). Trả null nếu vụ không apply
// mẫu nào (B13 trả appliedTemplate: null).
export default function AppliedTemplateBadge({ cropSeasonId }: Props) {
  const q = useAppliedTemplateInfo(cropSeasonId);
  const info = q.data?.data?.appliedTemplate;
  if (!info) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="bg-emerald-500/10 text-emerald-700 border-emerald-200 cursor-help"
        >
          <Sparkles className="mr-1 h-3 w-3" />
          Tạo từ mẫu: {info.templateName ?? "(không tên)"} · v{info.version ?? 1}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        Áp dụng lúc {new Date(info.appliedAt).toLocaleString("vi-VN")}.
        Sửa mẫu gốc về sau KHÔNG ảnh hưởng vụ này (BR-115).
      </TooltipContent>
    </Tooltip>
  );
}
