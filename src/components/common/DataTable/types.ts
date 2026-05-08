import type { LucideIcon } from "lucide-react";

export type DataTableAction<TData> = {
  key: string;
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "destructive";
  hidden?: (row: TData) => boolean;
  disabled?: (row: TData) => boolean;
  onSelect: (row: TData) => void;
};
