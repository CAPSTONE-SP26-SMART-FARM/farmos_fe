---
name: implement-feature
description: Implement một feature FE mới từ business spec (.md, mockup, hoặc mô tả) theo flow Endpoint → Schema → Service → Query → Page. Trigger khi user nói "implement feature X cho FE", "build trang Y theo spec", "code phần Z theo mockup".
---

# Skill — Implement Feature từ Business Spec

> Trước khi bắt đầu, đọc:
> - [../../rules/01-context-project.md](../../rules/01-context-project.md)
> - [../../rules/02-techstack.md](../../rules/02-techstack.md)
> - [../../rules/04-file-structure-rules.md](../../rules/04-file-structure-rules.md)
> - [../../rules/05-api-flow.md](../../rules/05-api-flow.md)

## When to use

- User gửi business spec / mockup / Figma link / mô tả flow và yêu cầu build UI.
- User nói: "implement feature X", "build page Y", "code lại flow Z".

## Pre-flight — clarify trước khi code

Nếu spec thiếu, hỏi (hoặc list assumption trong report nếu user đã nói "tự quyết"):

1. **Role nào dùng?** (admin / owner / manager / doctor) — quyết định folder `[Role]Page/`.
2. **API endpoint?** Đã có ở `constants/endpoints.ts` chưa? BE response shape thế nào?
3. **CRUD operations cần?** List / Create / Update / Delete / Detail?
4. **Filter / pagination / search?**
5. **Realtime cần không?** Event nào?

## Build order — outside-in

Khác BE (inside-out). FE build theo flow data: type → service → query → component.

### 1. Types — `src/types/[entity].ts`
- Define interface match BE response.
- Enum (status, role) → đặt ở [../../rules/01-context-project.md] hoặc `constants/`.

### 2. Endpoint + Query key — `src/constants/endpoints.ts`
- Thêm path constant: `ENDPOINTS.DOCTOR_WITHDRAWAL = "/doctor/withdrawals"`.
- Thêm `QUERY_KEYS.DOCTOR_WITHDRAWAL_LIST = ["doctor-withdrawal", "list"]`.

### 3. Zod schema — `src/schemaValidatation/[entity].ts` (lưu ý typo folder)
- Form schema (create / edit).
- Export inferred type: `export type CreateXInput = z.infer<typeof createXSchema>`.

### 4. Service — `src/services/[entity]Service.ts`
- Function thuần gọi `api.get/post/put/patch/delete`.
- Không try-catch ở đây. Không toast / navigate.

### 5. Query hook — `src/queries/use[Entity].ts`
- `useQuery` cho list / detail.
- `useMutation` cho create / update / delete + `invalidateQueries` trong `onSuccess`.
- Toast `sonner` trong `onSuccess` / `onError`.

### 6. Page + sub-components — `src/pages/[Role]Page/[Feature]/`
- `[Feature]Page.tsx` (max 350 dòng) — orchestration only.
- `_components/` — Table, Columns, RowActions, CreateDialog, EditDialog, DeleteAlert, Form.

### 7. Route — `src/routes/`
- Register route + guard (role-based, xem [../../rules/09-role-based-ui.md]).

## Verify trước khi báo done

- [ ] **🇻🇳 100% UI tiếng Việt, ngôn từ thân thiện** — xem [../../rules/17-vietnamese-copywriting.md]. Không còn `Submit/Cancel/OK/Save/Delete/Loading` raw. Status/enum dịch qua Label map. Ngày `dd/MM/yyyy`, tiền `1.234.567đ`. Error gợi cách sửa. Empty state có CTA.
- [ ] `pnpm build` pass (TS strict).
- [ ] `pnpm lint` pass.
- [ ] Không file > giới hạn ([../../rules/04-file-structure-rules.md]: page 350, file thường 500).
- [ ] Loading / Error / Empty states đầy đủ ([../../rules/07-loading-error-empty.md]).
- [ ] Không có raw HTML (`<button>`, `<input>`) — luôn shadcn.
- [ ] Refresh = `invalidateQueries`, KHÔNG `window.location.reload()`.
- [ ] Không hiện raw ID/UUID lên UI.
- [ ] Form: RHF + Zod, dialog reset đúng ([../../rules/06-form-pattern.md]).

## Anti-patterns thường gặp

- ❌ `useQuery` trong `_components/` — phải ở Page, truyền data xuống qua props.
- ❌ Service gọi từ Page (skip useMutation hook).
- ❌ Dùng `cacheTime` thay vì `gcTime` (React Query v5).
- ❌ `.nonempty()` Zod (v4 không còn) — dùng `.min(1)`.
- ❌ Tạo wrapper / sửa trực tiếp file trong `src/components/ui/`.
