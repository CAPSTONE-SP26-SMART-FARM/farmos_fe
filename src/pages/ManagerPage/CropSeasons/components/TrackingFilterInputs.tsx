import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { TrackingEntityType } from "@/schemaValidatation/tracking";

const TRACKING_TYPE_OPTIONS: Array<{ value: TrackingEntityType | "all"; label: string }> = [
  { value: "all", label: "Tất cả loại" },
  { value: "crop_season", label: "Mùa vụ" },
  { value: "production_milestone", label: "Mốc công việc" },
  { value: "employee_task", label: "Công việc" },
  { value: "harvest_record", label: "Bản ghi thu hoạch" },
  { value: "iot_device_assignment", label: "Thiết bị IoT" },
];

export function EntityTypeCombobox({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = TRACKING_TYPE_OPTIONS.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-52 justify-between h-9 text-sm font-normal"
        >
          {selected?.label ?? "Chọn loại..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0">
        <Command>
          <CommandInput placeholder="Tìm loại..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy.</CommandEmpty>
            <CommandGroup>
              {TRACKING_TYPE_OPTIONS.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "all" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === opt.value ? "opacity-100" : "opacity-0")} />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function DatePickerInput({
  value,
  onValueChange,
  placeholder = "Chọn ngày",
}: {
  value: Date | undefined;
  onValueChange: (date: Date | undefined) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-36 justify-start text-left h-9 text-sm font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {value ? format(value, "dd/MM/yyyy", { locale: vi }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => { onValueChange(date); setOpen(false); }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
