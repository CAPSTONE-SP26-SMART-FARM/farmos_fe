import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, History, Send, Sprout } from "lucide-react";

export type HistoryMenuValue = "seasons" | "requests";

export function HistoryMenu({
  hasCurrentSeason,
  onSelect,
}: {
  /** Disable mục "Lịch sử duyệt" khi không có vụ mùa hiện tại để lấy. */
  hasCurrentSeason: boolean;
  onSelect: (value: HistoryMenuValue) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Mở menu lịch sử"
          className="gap-1.5"
        >
          <History className="h-4 w-4" />
          Lịch sử
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => onSelect("seasons")}>
          <Sprout className="h-4 w-4 mr-2" />
          Lịch sử mùa vụ
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!hasCurrentSeason}
          onSelect={() => {
            if (hasCurrentSeason) onSelect("requests");
          }}
        >
          <Send className="h-4 w-4 mr-2" />
          Lịch sử duyệt
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
