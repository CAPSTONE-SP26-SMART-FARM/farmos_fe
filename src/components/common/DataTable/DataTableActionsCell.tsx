import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DataTableAction } from "./types";

interface DataTableActionsCellProps<TData> {
  row: TData;
  actions: DataTableAction<TData>[];
}

export function DataTableActionsCell<TData>({
  row,
  actions,
}: DataTableActionsCellProps<TData>) {
  const visibleActions = actions.filter((a) => !a.hidden?.(row));
  if (visibleActions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Mở menu thao tác</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.key}
              disabled={action.disabled?.(row)}
              onSelect={() => action.onSelect(row)}
              className={cn(
                action.variant === "destructive" &&
                  "text-destructive focus:text-destructive",
              )}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default DataTableActionsCell;
