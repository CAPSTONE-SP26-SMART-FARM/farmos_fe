import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isValid, parse } from "date-fns";
import { CalendarDays } from "lucide-react";

/**
 * DatePickerField — extract chung từ AdminCommissionRulesPage / ManagerCropSeasonsPage.
 *
 * Convention (theo `docs/form-error-and-date-handling.md` mục 5):
 *  - Form state lưu dạng `yyyy-MM-dd` (string).
 *  - Service convert sang ISO bằng `toISO(v)` ở `services/*` trước khi gửi BE.
 *  - Khi nhận từ BE (ISO datetime), parse bằng `parseBackendDate` trước render.
 *
 * Dùng với React Hook Form: bọc qua `Controller` (DatePicker không phải native input).
 *
 * @example
 * <Controller
 *   name="snapshotDate"
 *   control={form.control}
 *   render={({ field, fieldState }) => (
 *     <DatePickerField
 *       label="Ngày chụp DQS"
 *       value={field.value ?? ""}
 *       onChange={field.onChange}
 *       error={fieldState.error?.message}
 *     />
 *   )}
 * />
 */

const DATE_DISPLAY_FORMAT = "dd/MM/yyyy";
const DATE_PAYLOAD_FORMAT = "yyyy-MM-dd";

function parseFormStateDate(value: string | null | undefined) {
  if (!value) return undefined;
  const parsed = parse(value, DATE_PAYLOAD_FORMAT, new Date());
  if (isValid(parsed)) return parsed;
  // Fallback: BE đôi khi trả ISO datetime — vẫn parse được.
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : undefined;
}

function formatPickerDate(value: string | null | undefined) {
  const parsed = parseFormStateDate(value);
  return parsed ? format(parsed, DATE_DISPLAY_FORMAT) : "";
}

export interface DatePickerFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  placeholder?: string;
  /** ISO/yyyy-MM-dd. Calendar chặn ngày trước. */
  minDate?: Date;
  /** ISO/yyyy-MM-dd. Calendar chặn ngày sau. */
  maxDate?: Date;
  disabled?: boolean;
}

function DatePickerField({
  label,
  value,
  onChange,
  error,
  helperText,
  placeholder,
  minDate,
  maxDate,
  disabled,
}: DatePickerFieldProps) {
  return (
    <div className="space-y-1">
      {label && <Label>{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-between text-left font-normal"
          >
            {value ? (
              formatPickerDate(value)
            ) : (
              <span className="text-muted-foreground">
                {placeholder ?? "Chọn ngày"}
              </span>
            )}
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
        >
          <Calendar
            mode="single"
            selected={parseFormStateDate(value)}
            onSelect={(date) =>
              onChange(date ? format(date, DATE_PAYLOAD_FORMAT) : "")
            }
            disabled={(d) => {
              if (minDate && d < minDate) return true;
              if (maxDate && d > maxDate) return true;
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}

export default DatePickerField;
