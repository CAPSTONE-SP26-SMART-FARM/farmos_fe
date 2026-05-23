# `.claude/` — Hướng dẫn sử dụng Rules & Skills cho FarmOS Frontend

> Bộ rule + skill này giúp Claude Code (CLI, Cursor, hoặc bất kỳ agent đọc được `.claude/`) làm việc trên `farmos_fe` đúng convention React 19 + TypeScript + shadcn/ui + TanStack Query + RHF + Zod.

---

## 1. TL;DR — Cách dùng nhanh

### Trường hợp 1 — Implement feature mới từ spec / mockup

```
"Implement feature doctor-withdrawal cho role doctor theo spec ..."
"Build page quản lý IoT device cho owner"
```

→ Claude tự gọi skill [`implement-feature`](skills/implement-feature/SKILL.md), follow flow Endpoint → Schema → Service → Query → Page, verify build + lint.

### Trường hợp 2 — Scaffold page mới

```
"Scaffold page doctor-withdrawals trong DoctorPage"
"Tạo feature folder cho admin/commission-rules"
```

→ Claude gọi skill [`create-page`](skills/create-page/SKILL.md), tạo `[Feature]Page.tsx` + `_components/` đầy đủ template.

### Trường hợp 3 — Add form

```
"Tạo form create/edit cho doctor-withdrawal"
"Form validate amount + bankAccount"
```

→ Claude gọi skill [`add-form`](skills/add-form/SKILL.md), build RHF + Zod schema, handle 422 BE error.

### Trường hợp 4 — Subscribe realtime event

```
"FE nhận event farm.member.invited để refresh member list"
"Subscribe socket khi prescription được tạo"
```

→ Claude gọi skill [`add-realtime-listener`](skills/add-realtime-listener/SKILL.md), subscribe + invalidate query + cleanup.

### Trường hợp 5 — Sửa code bình thường

Claude tự đọc `CLAUDE.md` root + rule liên quan và apply convention.

---

## 2. Cấu trúc folder

```
farmos_fe/
├── CLAUDE.md                              ← project memory — Claude auto-load đầu tiên
└── .claude/
    ├── README.md                          ← file này
    ├── settings.json                      ← allow lệnh an toàn + deny edit src/components/ui/**
    ├── rules/                             ← 16 rule docs (01-04 auto-import, 05-16 đọc theo task)
    │   ├── 01-context-project.md
    │   ├── 02-techstack.md
    │   ├── 03-typescript-pattern.md
    │   ├── 04-file-structure-rules.md
    │   ├── 05-api-flow.md
    │   ├── 06-form-pattern.md
    │   ├── 07-loading-error-empty.md
    │   ├── 08-dialog-pattern.md
    │   ├── 09-role-based-ui.md
    │   ├── 10-filter-pagination-table.md
    │   ├── 11-realtime-socket.md
    │   ├── 12-accessibility.md
    │   ├── 13-animation-pattern.md
    │   ├── 14-ux-layout-thinking.md
    │   ├── 15-user-flow-template.md
    │   └── 16-verify-checklist.md
    └── skills/                            ← 4 skill, auto-trigger theo keyword
        ├── implement-feature/SKILL.md
        ├── create-page/SKILL.md
        ├── add-form/SKILL.md
        └── add-realtime-listener/SKILL.md
```

---

## 3. Rules — Khi nào đọc cái nào?

| # | File | Đọc khi… |
|---|------|----------|
| 01 | [context-project](rules/01-context-project.md) | Onboard project, hiểu folder structure + business domain |
| 02 | [techstack](rules/02-techstack.md) | Khi dùng React 19 hooks, đụng version-sensitive API (Zod v4, RQ v5, Tailwind v4) |
| 03 | [typescript-pattern](rules/03-typescript-pattern.md) | Trước khi viết TS — generics, discriminated union, utility types |
| 04 | [file-structure-rules](rules/04-file-structure-rules.md) | Tạo file mới, gần chạm giới hạn dòng, không chắc đặt file ở folder nào |
| 05 | [api-flow](rules/05-api-flow.md) | API integration mới — Endpoint → Schema → Service → Query → Page |
| 06 | [form-pattern](rules/06-form-pattern.md) | Form mới hoặc refactor form cũ |
| 07 | [loading-error-empty](rules/07-loading-error-empty.md) | Cần hiển thị state loading / error / empty |
| 08 | [dialog-pattern](rules/08-dialog-pattern.md) | Dialog / AlertDialog / Sheet / row actions |
| 09 | [role-based-ui](rules/09-role-based-ui.md) | Hiển thị/ẩn UI theo role, route guard |
| 10 | [filter-pagination-table](rules/10-filter-pagination-table.md) | Table mới, filter, pagination — ⚠️ scan codebase trước khi tạo |
| 11 | [realtime-socket](rules/11-realtime-socket.md) | Socket.IO + invalidate query, cleanup |
| 12 | [accessibility](rules/12-accessibility.md) | aria-label, form labels, keyboard nav |
| 13 | [animation-pattern](rules/13-animation-pattern.md) | Framer Motion, transition |
| 14 | [ux-layout-thinking](rules/14-ux-layout-thinking.md) | Thiết kế lại UI, đề xuất layout mới |
| 15 | [user-flow-template](rules/15-user-flow-template.md) | Mô tả user flow trước khi code feature mới |
| 16 | [verify-checklist](rules/16-verify-checklist.md) | Trước khi báo task done |
| 17 | [vietnamese-copywriting](rules/17-vietnamese-copywriting.md) | **🇻🇳 LUÔN — RULE QUAN TRỌNG NHẤT** — 100% UI tiếng Việt, ngôn từ thân thiện cho nông dân |

`CLAUDE.md` root là **index** + strict rules — luôn load và `@`-import sẵn rule 01-04 + 17. Rule 05-16 chỉ được Claude đọc khi task liên quan (tiết kiệm context). Rule 17 (tiếng Việt) là rule **quan trọng nhất** — auto-import vì app hoạt động ở VN, mọi text user thấy phải tiếng Việt thân thiện.

---

## 4. Skills — Trigger keywords

### `implement-feature`
- "implement feature X"
- "build page Y theo spec / mockup"
- "code flow Z"

### `create-page`
- "tạo page X cho role Y"
- "scaffold feature folder cho ..."
- "create page X"

### `add-form`
- "tạo form create/edit X"
- "form validate Y"
- "add form Z"

### `add-realtime-listener`
- "FE nhận event X realtime"
- "subscribe socket Y"
- "update list realtime khi ..."

> Nếu Claude không tự gọi skill: "Use skill `<name>` để ...".

---

## 5. Workflow tiêu biểu

### A. Implement feature mới từ đầu

```
You: "Implement page quản lý yêu cầu rút tiền cho doctor, API GET/POST /doctor/withdrawals"

Claude:
  1. Đọc 01, 02, 03, 04, 05, 06 (form), 08 (dialog), 10 (table)
  2. Thêm endpoint + query key vào src/constants/endpoints.ts
  3. Tạo type src/types/doctorWithdrawal.ts
  4. Tạo Zod schema src/schemaValidatation/doctorWithdrawal.ts
  5. Tạo src/services/doctorWithdrawalService.ts
  6. Tạo src/queries/useDoctorWithdrawal.ts
  7. Tạo src/pages/DoctorPage/Withdrawals/ + _components/
  8. Register route trong src/routes/
  9. pnpm build + pnpm lint
  10. Báo done
```

### B. Sửa nhỏ existing page

```
You: "Thêm filter theo status vào trang doctor/withdrawals"

Claude:
  1. Đọc rules 10 (filter-pagination)
  2. Sửa WithdrawalsPage.tsx + WithdrawalsFilter.tsx
  3. Update useDoctorWithdrawal queryKey để include filter
  4. pnpm build
  5. Báo done
```

### C. Bug fix

```
You: "Fix bug: list device vẫn cache sau khi xóa"

Claude:
  1. Đọc useDevice.ts → check invalidateQueries trong delete mutation
  2. Fix queryKey invalidate đúng
  3. pnpm build
  4. Update BUGS.md (auto)
```

---

## 6. Strict rules — Claude sẽ luôn enforce

(Xem chi tiết trong [../CLAUDE.md](../CLAUDE.md))

- ✅ Luôn dùng shadcn `@/components/ui/*`, không raw HTML.
- ✅ Luôn `lucide-react` cho icon — không emoji / icon lib khác.
- ❌ Không hiện raw ID/UUID lên UI.
- ❌ Không `window.location.reload()` — dùng `invalidateQueries`.
- ✅ Form luôn RHF + Zod.
- ❌ Không sửa `src/components/ui/**`.
- ❌ Không `useQuery` trong `_components/` con.
- ❌ Page > 350 dòng, file > 500 dòng → tách ngay.
- ❌ Không `.nonempty()` (Zod v4), không `cacheTime` (RQ v5).

`.claude/settings.json` enforce một phần cứng: `deny` Edit/Write `src/components/ui/**`. Còn lại là responsibility của Claude khi viết code.

---

## 7. Tips để Claude làm việc hiệu quả nhất

### 7.1. Trỏ thẳng tới rule khi cần

> ✅ "Apply pattern trong `.claude/rules/06-form-pattern.md` §3 cho form này"

### 7.2. Cung cấp spec đầy đủ

Tối thiểu cần:
- Role nào dùng?
- API endpoint + response shape?
- CRUD nào cần?
- Filter / pagination / search?
- Realtime cần không?

Spec thiếu → Claude phải đoán (sẽ list assumption nhưng dễ lệch).

### 7.3. Phân chia task lớn

Spec gồm nhiều page → chia mini-task:
```
"Step 1: scaffold trang list + table"
→ done, review UI
"Step 2: add create / edit dialog"
→ done
"Step 3: add filter + realtime"
```

### 7.4. Verify thủ công khi liên quan UI / realtime

`pnpm build` chỉ check TS. Sau khi Claude báo done:
1. `pnpm dev` → mở browser.
2. Click qua flow chính + edge case.
3. Connect Socket.IO → check listener.

---

## 8. Update rules / skills

Khi convention đổi:
1. Sửa file `.claude/rules/<n>-<topic>.md` hoặc `.claude/skills/<name>/SKILL.md`.
2. Update `CLAUDE.md` root + section 2 + 3 của file này.
3. Commit cùng PR thay đổi convention.

### Khi thêm rule mới
- Số thứ tự kế tiếp (17, 18, ...).
- Format giống các rule hiện có.
- Update bảng index trong [../CLAUDE.md](../CLAUDE.md) và section 3 file này.

### Khi thêm skill mới
- Tạo folder `.claude/skills/<skill-name>/`.
- File `SKILL.md` với YAML frontmatter `name` + `description` (description bao gồm trigger keyword).
- Update [../CLAUDE.md](../CLAUDE.md) bảng skills + section 4 file này.

---

## 9. Liên hệ với backend

- Backend rules: [../../farm_os_be/.claude/](../../farm_os_be/.claude/)
- Khi FE cần realtime event mới → BE phải implement trước (xem [BE add-realtime-event skill](../../farm_os_be/.claude/skills/add-realtime-event/SKILL.md)).
- Type FE phải match BE response shape — khi BE thay đổi DTO, sync FE `src/types/`.

---

## 10. Cheat sheet — Commands

```bash
# Dev server (bạn tự chạy để smoke test)
pnpm dev

# Verify TS compile (Claude tự chạy trước khi báo done)
pnpm build

# Lint
pnpm lint

# Preview production build
pnpm preview
```

---

## 11. Hỏi đáp nhanh

**Q: Claude dùng raw `<button>` thay vì shadcn `<Button>`?**
A: Paste `CLAUDE.md` strict rule đầu tiên + `.claude/rules/04-file-structure-rules.md`.

**Q: Claude dùng `window.location.reload()` để refresh?**
A: Paste `.claude/rules/05-api-flow.md` + bắt dùng `queryClient.invalidateQueries`.

**Q: Claude tạo file 600 dòng?**
A: Paste `.claude/rules/04-file-structure-rules.md` §1 "Giới hạn dòng".

**Q: Claude dùng `.nonempty()` / `cacheTime`?**
A: Paste `.claude/rules/02-techstack.md` section Zod v4 + React Query v5.

**Q: Bộ rule này áp dụng cho `farm_os_be` / mobile không?**
A: Không — chỉ cho `farmos_fe` (React Web). BE có [bộ riêng](../../farm_os_be/.claude/). Mobile cần bộ rule riêng (React Native).
