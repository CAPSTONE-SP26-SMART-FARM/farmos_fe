# RULES-REACT-001 — FarmOS Frontend Rule Set

Bộ rule prompt chuẩn hóa cho dự án **FarmOS Frontend** (React 19 + TypeScript + shadcn/ui).  
Dùng với AI coding assistant: **Cursor**, **Claude Code**, **GitHub Copilot Chat**.

---

## Cấu trúc bộ rule

```
RULES-REACT-001/
├── README.md                       ← file này
│
├── [CONTEXT — luôn đính kèm]
│   ├── 01-context-project.md       Project structure, naming convention, business domain
│   └── 02-techstack.md             Package versions, hook optimization rules
│
├── [FOUNDATION — đọc 1 lần, nhớ mãi]
│   ├── 03-typescript-pattern.md    Strict typing, generics, discriminated union, utility types
│   └── 04-file-structure-rules.md  File limits, icon rules, folder responsibilities
│
├── [IMPLEMENTATION — dùng hàng ngày]
│   ├── 05-api-flow.md              Endpoint → Schema → Service → Query → Page
│   ├── 06-form-pattern.md          RHF + Zod, reset dialog, edit form, 422 error
│   ├── 07-loading-error-empty.md   Skeleton vs Spinner, error types, empty vs no-result
│   ├── 08-dialog-pattern.md        Dialog vs AlertDialog vs Sheet, row actions
│   ├── 09-role-based-ui.md         Hide vs disable, RoleName enum, route guards
│   └── 10-filter-pagination-table.md  Filter, date range, clear filter, ProPagination, Table scan
│
├── [ENHANCEMENT — dùng khi cần]
│   ├── 11-realtime-socket.md       Socket + invalidate query, cleanup, notification
│   ├── 12-accessibility.md         aria-label, form labels, keyboard navigation
│   └── 13-animation-pattern.md     Framer Motion rules, transition strategy
│
└── [PLANNING & DESIGN]
    ├── 14-ux-layout-thinking.md    Layout thinking, user behavior simulation, anti-patterns
    ├── 15-user-flow-template.md    Template mô tả user flow trước khi code
    └── 16-verify-checklist.md      Checklist verify flow trước khi implement
```

---

## Hướng dẫn sử dụng

### Nguyên tắc chung

- **01 + 02 luôn đính kèm** trong mọi prompt — AI cần biết context và techstack
- Chỉ thêm rule files **liên quan đến task hiện tại** — đừng paste cả bộ vào 1 prompt
- Câu mở đầu "Bạn là senior React developer..." **đã có sẵn** ở đầu mỗi file
- Dùng **14 → 15 → implement**: mô tả flow trước, verify, rồi mới code

---

### Kịch bản sử dụng

#### Tạo feature mới (CRUD)
```
Paste: 01 + 02 + 03 + 04 + 05 + 06 + 07 + 08
Điền: 14 → 15 (layout thinking → user flow)
Verify: 16
→ Implement
```

#### Refactor / thiết kế lại UI
```
Paste: 01 + 14
→ AI phân tích layout hiện tại, đề xuất bố cục mới với lý do
```

#### Tạo feature có realtime
```
Paste: 01 + 02 + 03 + 04 + 05 + 11
Điền: 15
```

#### Fix bug / refactor component
```
Paste: 01 + 02 + 04
+ file rule liên quan đến bug (ví dụ 06 nếu bug trong form)
```

#### Review code / AI code review
```
Paste: 01 + 02 + 16 (verify checklist)
→ AI sẽ review theo checklist
```

#### Tạo table mới
```
Paste: 01 + 02 + 04 + 10
⚠️  Nhắc AI scan codebase trước khi tạo (rule trong 10)
```

#### Multi-role UI
```
Paste: 01 + 02 + 04 + 09
```

---

### Prompt wrapper mẫu

Paste đoạn này **trước** khi paste nội dung rule files:

```
[CONTEXT]
{01-context-project.md}
{02-techstack.md}

[RULES]
{file rule liên quan}

[TASK]
Implement [mô tả feature]. Theo đúng rule trên.
Bắt đầu bằng cách hỏi nếu cần thêm thông tin trước khi code.
```

---

### Khi nào KHÔNG cần rule files

| Tình huống | Làm thế nào |
|------------|-------------|
| Câu hỏi nhanh về syntax | Hỏi thẳng, không cần paste rule |
| Sửa typo / style nhỏ | Không cần rule |
| Debug logic đơn giản | Chỉ paste 01 + 02 |
| Tạo component đơn giản (< 50 dòng) | Chỉ paste 01 + 03 |

---

### File nào nặng nhất (token) — ưu tiên khi cần cắt bớt

Nếu prompt quá dài, cắt theo thứ tự này (cắt cuối danh sách trước):

```
Giữ lại:  01, 02, 03, 04
Cắt nếu cần: 14, 15, 09, 12, 13
```

---

## Cập nhật bộ rule

Khi project thay đổi pattern, cập nhật đúng file rule — không tạo rule mới chồng lên.  
Đánh version bằng tên folder: `RULES-REACT-002` khi có breaking change lớn.

| Thay đổi | File cần update |
|---------|----------------|
| Thêm package mới | `02-techstack.md` |
| Thay đổi folder structure | `03-file-structure-rules.md` |
| Thêm API pattern mới | `04-api-flow.md` |
| Thay đổi table/pagination pattern | `05-filter-pagination-table.md` |
| Thêm socket event mới | `09-realtime-socket.md` |
| Thêm role mới | `10-role-based-ui.md`, `01-context-project.md` |
