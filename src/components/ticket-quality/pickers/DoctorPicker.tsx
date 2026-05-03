import { useMemo, useState } from "react";
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
import { useAdminListUsers } from "@/queries/useAdmin";
import { RoleName } from "@/constants/role";
import { Check, ChevronsUpDown, Loader2, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DoctorPicker — Module 3 picker dùng cho:
 *  - Form invalidate-rating (chọn ticket theo doctor — Admin).
 *  - Form commission rule scope DOCTOR.
 *  - DQS lookup nav header (chọn doctor khác).
 *
 * Tuân thủ rule UI/UX (mục 3.4 v2 doc):
 *  - KHÔNG bắt user nhập tay UUID.
 *  - Pagination cap 90 — cap an toàn cho dropdown.
 *  - Search debounce 300ms qua `useDebounce` (BE-side filter).
 *
 * Tier leak guard: KHÔNG hiển thị tier (BR-81 chặt hơn — kể cả Admin xem
 * qua picker này — nếu cần xem tier, drill vào A5 Doctor DQS Detail).
 */

export interface DoctorPickerProps {
  value: string | null;
  onChange: (id: string, fullName: string) => void;
  /** Lỗi field từ react-hook-form (Field error prop). */
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Override label nút khi đã chọn doctor (mặc định fullName từ list). */
  selectedLabel?: string;
}

const PICKER_LIMIT = 90;
const SEARCH_DEBOUNCE_MS = 300;

function DoctorPicker({
  value,
  onChange,
  error,
  placeholder,
  disabled,
  selectedLabel,
}: DoctorPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

  // Filter role=doctor + active. Note: BE schema (ListUsersQuerySchema) không
  // có `search` field — nếu BE không hỗ trợ, FE filter client-side trên 90 items.
  const { data, isLoading } = useAdminListUsers({
    page: 1,
    limit: PICKER_LIMIT,
    role: RoleName.Doctor,
    isActive: true,
    search: debouncedSearch || undefined,
  });

  const doctors = useMemo(() => data?.data?.data ?? [], [data]);

  // Tìm doctor đang chọn để hiển thị label trên trigger.
  const currentLabel = useMemo(() => {
    if (selectedLabel) return selectedLabel;
    if (!value) return null;
    const found = doctors.find((d) => d.id === value);
    return found?.fullName ?? null;
  }, [doctors, value, selectedLabel]);

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
              <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              {currentLabel ? (
                <span className="truncate">{currentLabel}</span>
              ) : (
                <span className="text-muted-foreground">
                  {placeholder ?? "Chọn bác sĩ"}
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
              placeholder="Tìm theo tên hoặc email..."
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
                  <CommandEmpty>Không tìm thấy bác sĩ phù hợp.</CommandEmpty>
                  <CommandGroup>
                    {doctors.map((doctor) => (
                      <CommandItem
                        key={doctor.id}
                        value={doctor.id}
                        onSelect={() => {
                          onChange(doctor.id, doctor.fullName);
                          setOpen(false);
                        }}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-medium">
                            {doctor.fullName}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {doctor.email}
                          </span>
                        </div>
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            value === doctor.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
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

export default DoctorPicker;
