import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FarmPickerOption } from "./useFarmPickerOptions";

function formatFarmLabel(f: FarmPickerOption) {
  const code = f.farmCode ? ` · ${f.farmCode}` : "";
  return `${f.farmName}${code}`;
}

interface Props {
  options: FarmPickerOption[];
  value: string | undefined;
  onValueChange: (farmId: string | null) => void;
  disabled?: boolean;
}

export function QueueFarmPicker({
  options,
  value,
  onValueChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((f) => f.farmId === value);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-8 w-full min-w-[220px] max-w-sm justify-between font-normal"
        >
          <span className="truncate">
            {selected ? formatFarmLabel(selected) : "Tất cả nông trại"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Tìm tên hoặc mã nông trại..."
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>Không tìm thấy nông trại.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="tat-ca-nong-trai"
                onSelect={() => {
                  onValueChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0",
                  )}
                />
                Tất cả nông trại
              </CommandItem>
              {options.map((farm) => (
                <CommandItem
                  key={farm.farmId}
                  value={`${farm.farmName} ${farm.farmCode ?? ""} ${farm.ownerName}`}
                  onSelect={() => {
                    onValueChange(farm.farmId);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === farm.farmId ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span>{formatFarmLabel(farm)}</span>
                    <span className="text-xs text-muted-foreground">
                      {farm.ownerName}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
