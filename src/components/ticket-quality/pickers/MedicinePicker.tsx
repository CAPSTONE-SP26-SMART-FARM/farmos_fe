import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import useDebounce from "@/hooks/useDebounce";
import { useMedicineCatalog } from "@/queries/useMedicine";
import { Check, ChevronsUpDown, Loader2, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MedicinePicker — Module 3 picker dùng cho:
 *  - Admin Ticket Detail (A8) — chọn medicine để hiển thị label hoặc gắn ngữ cảnh.
 *  - (Tương lai) Form Doctor reissue prescription nếu BE mở web flow — hiện
 *    Module 3 KHÔNG build form Doctor trên web (mobile thay).
 *
 * Tuân thủ rule UI/UX (mục 3.4 v2 doc):
 *  - KHÔNG bắt user nhập tay UUID.
 *  - Search debounce 300ms (BE param `q`, không phải `search`).
 *  - Hiển thị badge "Ngừng X ngày" cho thuốc có withdrawalPeriodDays > 0
 *    (BR-77 — cảnh báo rủi ro thu hoạch).
 *  - BE catalog endpoint không có pagination — chỉ trả flat array. Cap
 *    client-side `MAX_DROPDOWN_ITEMS=90` để dropdown không quá tải.
 */

export interface MedicinePickerProps {
  value: string | null;
  onChange: (id: string, name: string, withdrawalPeriodDays: number | null) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Override label nút khi đã chọn (mặc định = name từ catalog). */
  selectedLabel?: string;
}

const MAX_DROPDOWN_ITEMS = 90;
const SEARCH_DEBOUNCE_MS = 300;

function MedicinePicker({
  value,
  onChange,
  error,
  placeholder,
  disabled,
  selectedLabel,
}: MedicinePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

  // BE catalog endpoint chỉ chấp nhận `q` + `species` (không có page/limit/isActive).
  const { data, isLoading } = useMedicineCatalog({
    q: debouncedSearch || undefined,
  });

  // BE catalog đã filter `isActive=true` server-side (theo doctor scope).
  // Cap dropdown 90 items client-side để tránh render quá tải.
  const medicines = useMemo(
    () => (data?.data?.data ?? []).slice(0, MAX_DROPDOWN_ITEMS),
    [data],
  );

  const currentLabel = useMemo(() => {
    if (selectedLabel) return selectedLabel;
    if (!value) return null;
    const found = medicines.find((m) => m.id === value);
    return found?.name ?? null;
  }, [medicines, value, selectedLabel]);

  return (
    <div className="space-y-1">
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
            className="w-full justify-between text-left font-normal"
          >
            <span className="flex items-center gap-2 truncate">
              <Pill className="h-4 w-4 text-muted-foreground shrink-0" />
              {currentLabel ? (
                <span className="truncate">{currentLabel}</span>
              ) : (
                <span className="text-muted-foreground">
                  {placeholder ?? "Chọn thuốc"}
                </span>
              )}
            </span>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Tìm theo tên hoặc hoạt chất..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>Không tìm thấy thuốc phù hợp.</CommandEmpty>
                  <CommandGroup>
                    {medicines.map((med) => {
                      const days = med.withdrawalPeriodDays;
                      return (
                        <CommandItem
                          key={med.id}
                          value={med.id}
                          onSelect={() => {
                            onChange(med.id, med.name, days);
                            setOpen(false);
                          }}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate font-medium">
                              {med.name}
                            </span>
                            {med.scientificName && (
                              <span className="truncate text-xs text-muted-foreground italic">
                                {med.scientificName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {days != null && days > 0 && (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0"
                              >
                                Ngừng {days} ngày
                              </Badge>
                            )}
                            <Check
                              className={cn(
                                "h-4 w-4",
                                value === med.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

export default MedicinePicker;
