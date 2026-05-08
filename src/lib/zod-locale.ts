import { z } from "zod";
import { vi } from "zod/locales";

// Áp dụng locale tiếng Việt cho toàn bộ Zod messages mặc định.
// Per-field message tự định nghĩa (vd `z.string().min(1, "Bắt buộc.")`) sẽ
// được giữ nguyên — locale chỉ là fallback cho default messages.
//
// Import file này 1 lần ở entry point (main.tsx) để áp dụng global.
z.config(vi());

// Override các message Zod mặc định sang text thân thiện hơn cho user cuối.
// `customError` chạy TRƯỚC `localeError`; trả `undefined` → fallback locale vi.
//
// Format số có dấu phẩy phân cách hàng nghìn (ví dụ "9.007.199.254.740.991").
const formatVnNumber = (n: number | bigint): string => {
  if (typeof n === "bigint") return n.toLocaleString("vi-VN");
  if (!Number.isFinite(n)) return String(n);
  return n.toLocaleString("vi-VN");
};

// Sentinel — Zod dùng MAX/MIN_SAFE_INTEGER khi user không truyền .max()/.min().
// Trong trường hợp đó, exposing số 9007199254740991 cho user là thông báo kỹ
// thuật vô nghĩa → thay bằng "Số quá lớn." / "Số quá nhỏ.".
const isTechnicalIntBound = (n: number | bigint): boolean => {
  if (typeof n === "bigint") {
    return n >= BigInt(Number.MAX_SAFE_INTEGER) || n <= BigInt(Number.MIN_SAFE_INTEGER);
  }
  return n === Number.MAX_SAFE_INTEGER || n === Number.MIN_SAFE_INTEGER;
};

z.config({
  customError: (issue) => {
    // Empty number → "Không được để trống." (RHF + valueAsNumber gửi NaN).
    if (issue.code === "invalid_type" && issue.expected === "number") {
      const input = issue.input;
      if (
        input === undefined ||
        input === null ||
        input === "" ||
        (typeof input === "number" && Number.isNaN(input))
      ) {
        return "Không được để trống.";
      }
    }

    // too_big — vượt giới hạn trên.
    if (issue.code === "too_big") {
      const { maximum, inclusive, origin } = issue;
      if (origin === "string") {
        return `Tối đa ${formatVnNumber(maximum)} ký tự.`;
      }
      if (origin === "array" || origin === "set") {
        return `Tối đa ${formatVnNumber(maximum)} phần tử.`;
      }
      if (origin === "number" || origin === "bigint" || origin === "int") {
        if (isTechnicalIntBound(maximum)) {
          return "Số quá lớn.";
        }
        return inclusive
          ? `Phải nhỏ hơn hoặc bằng ${formatVnNumber(maximum)}.`
          : `Phải nhỏ hơn ${formatVnNumber(maximum)}.`;
      }
      // Date / khác — generic
      return `Vượt quá giới hạn cho phép.`;
    }

    // too_small — dưới giới hạn dưới.
    if (issue.code === "too_small") {
      const { minimum, inclusive, origin } = issue;
      if (origin === "string") {
        if (typeof minimum === "number" && minimum === 1) {
          return "Không được để trống.";
        }
        return `Tối thiểu ${formatVnNumber(minimum)} ký tự.`;
      }
      if (origin === "array" || origin === "set") {
        return `Tối thiểu ${formatVnNumber(minimum)} phần tử.`;
      }
      if (origin === "number" || origin === "bigint" || origin === "int") {
        if (isTechnicalIntBound(minimum)) {
          return "Số quá nhỏ.";
        }
        return inclusive
          ? `Phải lớn hơn hoặc bằng ${formatVnNumber(minimum)}.`
          : `Phải lớn hơn ${formatVnNumber(minimum)}.`;
      }
      return `Nhỏ hơn giới hạn cho phép.`;
    }

    return undefined;
  },
});
