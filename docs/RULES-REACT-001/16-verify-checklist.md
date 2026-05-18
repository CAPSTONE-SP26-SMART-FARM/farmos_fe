# 06 - Verify Flow (Checklist trước khi implement)

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Mục đích

Sau khi điền xong [05-user-flow-template.md](./05-user-flow-template.md), chạy qua checklist này để verify flow trước khi code.  
Phát hiện lỗi ở đây rẻ hơn nhiều so với sau khi đã code xong.

---

## Checklist 1: UX Flow Completeness

Đặt câu hỏi cho từng bước trong happy path:

- [ ] **Mỗi action có response rõ ràng không?**  
  User click → UI phải phản hồi ngay (loading state, optimistic update, hoặc ít nhất là button disabled)

- [ ] **User biết action thành công/thất bại qua đâu?**  
  Toast message? Inline error? Redirect? — phải có ít nhất 1 trong 3

- [ ] **Flow có đảm bảo user không bị mất data không?**  
  Nếu close dialog giữa chừng, form đã điền có bị mất không? Cần confirm?

- [ ] **Navigation sau action có hợp lý không?**  
  Sau tạo mới → ở lại trang hay navigate sang detail? Sau xóa → quay về list?

- [ ] **Thứ tự thao tác có tự nhiên không?**  
  User có phải click qua quá nhiều bước để hoàn thành 1 task? Có thể rút gọn không?

---

## Checklist 2: Data & State

- [ ] **Có API call nào bị gọi thừa không?**  
  Ví dụ: load zones mỗi khi mở dialog thay vì load 1 lần khi vào trang

- [ ] **Sau mutation, data có được refresh đúng không?**  
  - `invalidateQueries` đúng key chưa?
  - Có cần refetch data ở màn hình khác không? (nếu có → invalidate thêm)

- [ ] **Query có `enabled` condition phù hợp không?**  
  - Query phụ thuộc vào `id` → `enabled: !!id`
  - Query chỉ chạy sau auth → `enabled: isAuthenticated`

- [ ] **State nào là server state, state nào là client state?**  
  - Server state → React Query (đừng dùng useState cho list data)
  - Client state (dialog open, tab, filter) → useState

- [ ] **Filter/search params có được sync với URL không?**  
  Nếu user refresh trang, filter có giữ nguyên không? (dùng `useSearchParams` nếu cần)

---

## Checklist 3: Component Architecture

- [ ] **Page component có > 500 dòng không?** → Tách ngay

- [ ] **Component nào nên ở `_components/` vs `common/`?**  
  - Dùng ở 1 feature → `_components/`
  - Dùng ở 2+ feature → `components/common/`

- [ ] **Props drilling có quá 2 cấp không?**  
  Page → Component → Sub-component truyền cùng prop → xem xét dùng hook hoặc context

- [ ] **Form component có tách khỏi Dialog không?**  
  `CreateDeviceDialog` nên render `DeviceForm`, không embed form JSX trực tiếp  
  → Vì form có thể dùng lại trong Edit dialog

---

## Checklist 4: UX Pattern Selection

### Table vs Card decision

Trả lời 4 câu hỏi:
1. Data có nhiều hơn 4 thuộc tính cần hiển thị cùng lúc không? → Nếu có → **Table**
2. User cần sort/filter theo nhiều cột không? → Nếu có → **Table**
3. Data có visual identity rõ ràng (ảnh, màu status nổi bật) không? → Nếu có → **Card**
4. User cần overview nhanh hơn là so sánh chi tiết? → Nếu có → **Card**

### Dialog vs Page navigation

- **Dùng Dialog** khi: Form ngắn (< 8 fields), action phụ, user cần giữ context trang hiện tại
- **Dùng Page mới** khi: Form dài (>= 8 fields), nhiều bước (wizard), detail view phức tạp

### Inline edit vs Dialog edit

- **Inline edit**: Chỉ 1-2 field đơn giản, dùng click-to-edit pattern
- **Dialog edit**: Form có validation phức tạp, nhiều fields liên quan

---

## Checklist 5: API & Type Safety

- [ ] **Tất cả endpoint đã được define trong `endpoints.ts` chưa?**
- [ ] **Zod schema đã có cho mọi form submit chưa?**
- [ ] **Response type đã có TypeScript interface chưa?** (`src/types/[entity].ts`)
- [ ] **Query keys có consistent với `QUERY_KEYS` constant chưa?**
- [ ] **Mutation có `onError` handler không?** (toast + `onMutationError`)

---

## Checklist 6: Permission & Guard

- [ ] **Route có đúng `allowedRoles` không?** (check `routes.ts`)
- [ ] **Feature có cần `requiresActiveSubscription: true` không?**
- [ ] **UI element có bị hide/disable dựa trên role không?** (button "Xóa" cho Admin vs không cho Manager)
- [ ] **Nếu user không có quyền, UX phản hồi gì?** (404, redirect, hay hide element?)

---

## Checklist 7: UI Implementation

- [ ] **Icon có phải từ `lucide-react` không?**  
  Không dùng `react-icons`, `heroicons`, emoji, SVG inline thay thế icon

- [ ] **Pagination có dùng `ProPagination` không?**  
  Import từ `@/components/common/pro-pagination` — không tự implement

- [ ] **Pagination pattern có đúng với độ phức tạp không?**
  - <= 2 filter, params cùng chỗ → `buildHref` đơn giản
  - >= 3 filter, params ở nhiều component → RHF `FormProvider` + `useFormContext` + `buildHref`

- [ ] **Page component có vượt 350 dòng không?** → Tách ngay thành `_components/`

- [ ] **Sub-component có vượt 500 dòng không?** → Tách tiếp

---

## Sign-off

Sau khi check xong tất cả items trên, điền vào đây:

```
Screen: ___________________________
Date reviewed: ___________________

[ ] UX Flow Completeness: PASS / FAIL
[ ] Data & State: PASS / FAIL  
[ ] Component Architecture: PASS / FAIL
[ ] UX Pattern Selection: PASS / FAIL
[ ] API & Type Safety: PASS / FAIL
[ ] Permission & Guard: PASS / FAIL
[ ] UI Implementation: PASS / FAIL

Ghi chú thay đổi so với flow ban đầu:
- ...
- ...

→ SẴN SÀNG IMPLEMENT: YES / NO
```

---

## Quick Red Flags (Dừng lại nếu thấy)

- Page component > 350 dòng từ đầu thiết kế → tách trước khi code
- Sub-component > 500 dòng → tách tiếp
- Form > 10 fields trong 1 dialog → cân nhắc chuyển sang page
- Gọi API trực tiếp trong component mà không qua query hook → sai pattern
- `useEffect` để sync server data vào local state → sai pattern (dùng React Query)
- Toast message tiếng Anh → phải là tiếng Việt
- Empty state không có → bắt buộc phải có
- Icon không phải `lucide-react` → đổi lại
- Pagination tự implement hoặc dùng component khác → dùng `ProPagination`
- Nhiều filter ở nhiều component nhưng không dùng RHF FormProvider → khó maintain
