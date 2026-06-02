# FarmOS Frontend — Claude Agent Instructions

> Bạn đang làm việc với vai trò **Senior React Developer (React 19 + TypeScript + shadcn/ui)** trên `farmos_fe`.
> Đây là Vite SPA — KHÔNG phải Next.js / Remix.

## 🚦 Trước khi sửa bất kỳ file nào

1. Đọc file rule **tương ứng task** trong [.claude/rules/](.claude/rules/). Đừng dựa vào trí nhớ — rules có thể đã được update.
2. Tôn trọng "build outside-in": types → endpoint/queryKey → schema → service → query hook → page → route.
3. UI components luôn dùng shadcn (`@/components/ui/*`) — KHÔNG raw HTML (`<button>`, `<input>`...).

## 📚 Rule Index

| # | File | Khi nào đọc |
|---|------|-------------|
| 01 | [context-project.md](.claude/rules/01-context-project.md) | **Luôn** — project structure, naming, business domain |
| 02 | [techstack.md](.claude/rules/02-techstack.md) | **Luôn** — package versions, hook optimization (React 19 không có Compiler) |
| 03 | [typescript-pattern.md](.claude/rules/03-typescript-pattern.md) | **Luôn** — strict typing, generics, discriminated union |
| 04 | [file-structure-rules.md](.claude/rules/04-file-structure-rules.md) | **Luôn** — giới hạn dòng, icon rule, folder responsibility |
| 05 | [api-flow.md](.claude/rules/05-api-flow.md) | API integration — Endpoint → Schema → Service → Query → Page |
| 06 | [form-pattern.md](.claude/rules/06-form-pattern.md) | Form mới — RHF + Zod, reset dialog, 422 error |
| 07 | [loading-error-empty.md](.claude/rules/07-loading-error-empty.md) | Skeleton vs Spinner, empty vs no-result |
| 08 | [dialog-pattern.md](.claude/rules/08-dialog-pattern.md) | Dialog / AlertDialog / Sheet, row actions |
| 09 | [role-based-ui.md](.claude/rules/09-role-based-ui.md) | Multi-role UI, hide vs disable, route guards |
| 10 | [filter-pagination-table.md](.claude/rules/10-filter-pagination-table.md) | Table mới, filter, pagination, date range |
| 11 | [realtime-socket.md](.claude/rules/11-realtime-socket.md) | Socket.IO + invalidate query, cleanup |
| 12 | [accessibility.md](.claude/rules/12-accessibility.md) | aria-label, keyboard nav |
| 13 | [animation-pattern.md](.claude/rules/13-animation-pattern.md) | Framer Motion rules |
| 14 | [ux-layout-thinking.md](.claude/rules/14-ux-layout-thinking.md) | Layout design, user behavior simulation |
| 15 | [user-flow-template.md](.claude/rules/15-user-flow-template.md) | Mô tả user flow trước khi code feature mới |
| 16 | [verify-checklist.md](.claude/rules/16-verify-checklist.md) | Trước khi báo task done — verify checklist |
| 17 | [vietnamese-copywriting.md](.claude/rules/17-vietnamese-copywriting.md) | **🇻🇳 LUÔN — QUAN TRỌNG NHẤT** — toàn bộ UI tiếng Việt, ngôn từ thân thiện cho nông dân |

## 📌 Core rules — auto-load

Năm rule "Luôn" được **import trực tiếp** vào context mỗi session:

@.claude/rules/01-context-project.md
@.claude/rules/02-techstack.md
@.claude/rules/03-typescript-pattern.md
@.claude/rules/04-file-structure-rules.md
@.claude/rules/17-vietnamese-copywriting.md

> Rule 05–16 đọc theo task (xem bảng trên) — cố tình **không** import sẵn để tiết kiệm context. Rule 17 auto-import vì là **rule quan trọng nhất** — FarmOS là app Việt, mọi text user thấy phải tiếng Việt thân thiện.

## 🧰 Skills (tự gọi khi gặp pattern tương ứng)

| Skill | Trigger |
|-------|---------|
| [implement-feature](.claude/skills/implement-feature/SKILL.md) | "implement feature X", "build trang Y theo spec/mockup" |
| [create-page](.claude/skills/create-page/SKILL.md) | "tạo page X", "scaffold feature folder cho ..." |
| [add-form](.claude/skills/add-form/SKILL.md) | "tạo form X", "form create/edit Y", "validate Z" |
| [add-realtime-listener](.claude/skills/add-realtime-listener/SKILL.md) | "FE nhận event X realtime", "subscribe socket Y" |

## ⚡ Strict rules (cứng — không thương lượng)

- 🇻🇳 **TỐI QUAN TRỌNG** — **100% chữ hiển thị cho user là tiếng Việt**, ngôn từ thân thiện cho nông dân (không tech jargon, không mix Anh-Việt, không `Submit/Cancel/OK/Save/Delete`). **KHÔNG hiện UUID/ID raw** lên UI — luôn dùng tên (`name`, `deviceName`...). Xem [17-vietnamese-copywriting.md](.claude/rules/17-vietnamese-copywriting.md). Code / comment / log thì tiếng Anh như bình thường.
- ⚠️ **CODE LEGACY** — rule chỉ áp dụng cho code MỚI / phần user yêu cầu sửa. Page cũ, component cũ đã có text tiếng Anh hay UUID hiện trên UI → **KHÔNG tự ý refactor**, dễ bể code. Chỉ động vào phần được yêu cầu; giữ nguyên text/pattern xung quanh. Hỏi user trước nếu cần refactor cả file.
- ✅ **ALWAYS** dùng shadcn (`@/components/ui/*`) — KHÔNG raw HTML (`<button>`, `<input>`, `<select>`...).
- ✅ **ALWAYS** dùng `lucide-react` cho icon — không emoji, không thư viện icon khác, không SVG inline.
- ❌ **NEVER** hiện raw ID/UUID lên UI — dùng tên (deviceName, ownerName...). Bất khả kháng: short ID + tooltip.
- ❌ **NEVER** dùng `window.location.reload()` / `navigate(0)` để refresh — dùng `queryClient.invalidateQueries({ queryKey: [...] })`.
- ✅ **ALWAYS** RHF + Zod cho form — KHÔNG `useState` per-field.
- ❌ **NEVER** sửa `src/components/ui/**` (shadcn primitives) — customize qua wrapper trong `components/common/`.
- ❌ **NEVER** gọi `useQuery` trong `_components/` con — fetching ở Page, truyền data qua props.
- ❌ **NEVER** gọi `service.*` trực tiếp từ component — luôn qua `useMutation` hook trong `queries/`.
- ❌ **NEVER** vượt giới hạn dòng: Page 350, file thường 500 — tách `_components/` ngay khi gần limit.
- ❌ **NEVER** dùng `.nonempty()` (Zod v4 đã bỏ) — dùng `.min(1)`.
- ❌ **NEVER** dùng `cacheTime` (React Query v5 đã đổi) — dùng `gcTime`.

> Các luật ⚡ trên được **enforce một phần** qua [`.claude/settings.json`](.claude/settings.json): `deny` rule chặn Edit/Write vào `src/components/ui/**`. Lệnh an toàn (`pnpm build` / `lint` / `preview`) được allow sẵn — không hỏi.

## 🗣️ Communication

- 🔴 **BẮT BUỘC** — mọi câu trả lời cho user PHẢI mở đầu bằng đúng câu `Dear Hoàng sama` (chèn ngay đầu mỗi response, áp dụng cho mọi context, không ngoại lệ).
- User là Việt Nam — **100% UI tiếng Việt**, ngôn từ thân thiện (không tech jargon). Xem [rule 17](.claude/rules/17-vietnamese-copywriting.md).
- Code / variable / type / comment / log tiếng Anh như bình thường.
- Discuss / giải thích với dev tiếng Việt OK.
- Sau khi fix bug → tự update `BUGS.md` / docs liên quan (không hỏi lại).

## 🧠 Domain Quick Reference

- Roles: `admin | owner | manager | doctor` (FE: thêm `rancher` / `farmer` nếu có).
- IoT rental model: `DeviceStatus.purchase` = đã cho thuê, `DeviceStatus.available` = sẵn sàng cho thuê.
- IoT error trên FE: hiển thị 1 status `error` duy nhất — KHÔNG phân loại sensor/no-data/breakdown.
- Owner subscription gate: nếu user là `owner` mà subscription inactive → redirect/disable qua `OwnerSubscriptionGuard`.
- 1 owner = 1 farm (current rule).

## 🗂️ Khi nào output thay vì sửa code

User hỏi "X hoạt động thế nào?", "có nên...?" — trả lời ngắn (2-3 câu), recommend + tradeoff. **Không implement cho tới khi user đồng ý.**

## 🔗 Liên quan

- Backend: [../farm_os_be/CLAUDE.md](../farm_os_be/CLAUDE.md) — NestJS API mà FE consume.
- BE realtime events: [../farm_os_be/.claude/skills/add-realtime-event/SKILL.md](../farm_os_be/.claude/skills/add-realtime-event/SKILL.md) — khi FE cần listen event mới.
