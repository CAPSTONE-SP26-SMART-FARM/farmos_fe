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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function ZoneSwitcherCombobox({
  zones,
  value,
  onValueChange,
}: {
  zones: Array<{ id: string; name: string }>;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = zones.find((z) => z.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-44 justify-between h-8 text-xs font-normal"
        >
          {selected?.name ?? "Chọn khu vực..."}
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-0">
        <Command>
          <CommandInput placeholder="Tìm khu vực..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="text-xs">Không tìm thấy.</CommandEmpty>
            <CommandGroup>
              {zones.map((zone) => (
                <CommandItem
                  key={zone.id}
                  value={zone.name}
                  onSelect={() => { onValueChange(zone.id); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-3.5 w-3.5", value === zone.id ? "opacity-100" : "opacity-0")} />
                  <span className="text-xs">{zone.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
