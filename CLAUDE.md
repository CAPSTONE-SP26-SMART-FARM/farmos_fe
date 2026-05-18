# FarmOS Frontend (`farmos_fe`)

React 19 + TypeScript + Vite + **shadcn/ui** + TanStack Query + React Hook Form + Zod.

---

## ⚠️ Đọc rules trước khi code

Rule set đầy đủ ở [../RULES-REACT-001/](../RULES-REACT-001/). **BẮT BUỘC đọc file phù hợp với task trước khi sửa code**.

### Luôn nắm (Context — load mọi task)
- [../RULES-REACT-001/01-context-project.md](../RULES-REACT-001/01-context-project.md) — project structure, naming, business domain
- [../RULES-REACT-001/02-techstack.md](../RULES-REACT-001/02-techstack.md) — package versions, hook optimization

### Foundation (đọc 1 lần, nhớ kỹ)
- [../RULES-REACT-001/03-typescript-pattern.md](../RULES-REACT-001/03-typescript-pattern.md) — strict typing, generics, discriminated union
- [../RULES-REACT-001/04-file-structure-rules.md](../RULES-REACT-001/04-file-structure-rules.md) — file limits, icon rules, folder responsibilities

### Implementation (đọc khi task liên quan)
| Task | File rule |
|------|-----------|
| API integration | [05-api-flow.md](../RULES-REACT-001/05-api-flow.md) — Endpoint → Schema → Service → Query → Page |
| Form | [06-form-pattern.md](../RULES-REACT-001/06-form-pattern.md) — RHF + Zod, reset dialog, edit form, 422 error |
| Loading/Error/Empty state | [07-loading-error-empty.md](../RULES-REACT-001/07-loading-error-empty.md) — Skeleton vs Spinner, empty vs no-result |
| Dialog/Sheet | [08-dialog-pattern.md](../RULES-REACT-001/08-dialog-pattern.md) — Dialog vs AlertDialog vs Sheet |
| Role-based UI | [09-role-based-ui.md](../RULES-REACT-001/09-role-based-ui.md) — hide vs disable, RoleName enum, route guards |
| Table/Filter/Pagination | [10-filter-pagination-table.md](../RULES-REACT-001/10-filter-pagination-table.md) — ProPagination, filter, date range |
| Realtime/Socket | [11-realtime-socket.md](../RULES-REACT-001/11-realtime-socket.md) — socket + invalidate query, cleanup |

### Enhancement
- [../RULES-REACT-001/12-accessibility.md](../RULES-REACT-001/12-accessibility.md) — aria-label, keyboard nav
- [../RULES-REACT-001/13-animation-pattern.md](../RULES-REACT-001/13-animation-pattern.md) — Framer Motion

### Planning / Design (dùng trước khi code feature mới)
- [../RULES-REACT-001/14-ux-layout-thinking.md](../RULES-REACT-001/14-ux-layout-thinking.md) — layout thinking, anti-patterns
- [../RULES-REACT-001/15-user-flow-template.md](../RULES-REACT-001/15-user-flow-template.md) — mô tả user flow trước khi code
- [../RULES-REACT-001/16-verify-checklist.md](../RULES-REACT-001/16-verify-checklist.md) — checklist verify trước khi implement

---

## Quy trình theo loại task

| Task | Đọc rules |
|------|-----------|
| CRUD feature mới | 01 + 02 + 03 + 04 + 05 + 06 + 07 + 08, rồi 14 → 15 → 16 |
| Feature có realtime | 01 + 02 + 03 + 04 + 05 + 11 + 15 |
| Tạo table mới | 01 + 02 + 04 + 10 (⚠️ scan codebase trước khi tạo) |
| Multi-role UI | 01 + 02 + 04 + 09 |
| Refactor UI / redesign | 01 + 14 |
| Fix bug trong form | 01 + 02 + 04 + 06 |
| Review code | 01 + 02 + 16 |

---

## Quick reminders (rules quan trọng nhất)

- ✅ **Luôn dùng shadcn** (`@/components/ui/*`) — KHÔNG dùng raw HTML (`<button>`, `<input>`...)
- ✅ **Mỗi component max 500 dòng** — vượt thì tách file, không gom 1 file lớn
- ❌ **KHÔNG hiện raw ID/UUID** lên UI — luôn dùng tên (deviceName, ownerName...). Bất khả kháng: short ID + tooltip + label rõ
- ✅ **Refresh button** = invalidate React Query, **KHÔNG** `window.location.reload()` / `navigate(0)`
- ✅ Sau khi fix bug → tự update BUGS.md / docs liên quan (không hỏi)

## IoT domain (FE)

- `DeviceStatus.purchase` = đã cho thuê | `available` = có thể sử dụng (rental, không phải sales)
- IoT error đơn giản: hiển thị 1 status `error` duy nhất, không phân loại sensor/no-data/breakdown
