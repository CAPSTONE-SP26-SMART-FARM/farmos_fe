# 12 - Animation Pattern (Framer Motion)

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Stack animation

- **framer-motion 12.29.2** — animation library chính
- Chỉ dùng animation cho **feedback UX có ý nghĩa** — không animate để cho đẹp
- Không dùng CSS `transition` thủ công khi Framer Motion đã cover
- Không dùng thư viện animation khác trong project này

---

## Khi nào dùng animation

| Dùng | Không dùng |
|------|------------|
| Mount/unmount component (modal, dialog, dropdown) | Decoration (hover glow, background shift) |
| Trạng thái thay đổi rõ ràng (loading → content) | List item đơn giản không có transition ý nghĩa |
| Feedback sau action (success check, error shake) | Text typing effect |
| Page transition (nếu cần) | Parallax, scroll effects phức tạp |

---

## Animate Presence — Mount/Unmount

Dùng `AnimatePresence` khi component xuất hiện/biến mất theo state:

```tsx
import { AnimatePresence, motion } from "framer-motion";

// Toast notification, dropdown, inline alert
function StatusBanner({ show, message }: { show: boolean; message: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="rounded-md bg-green-50 p-3"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## Stagger List — Danh sách xuất hiện lần lượt

Dùng khi list items xuất hiện lần đầu (không dùng cho refetch/filter):

```tsx
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

function DeviceGrid({ devices }: { devices: Device[] }) {
  return (
    <motion.div
      className="grid grid-cols-3 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {devices.map((device) => (
        <motion.div key={device.id} variants={itemVariants}>
          <DeviceCard device={device} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

**Chỉ dùng stagger cho initial load** — nếu user filter/search, không stagger lại (reset `key` hoặc dùng `layout`).

---

## Layout Animation — Reorder/Resize mượt

Khi list thay đổi thứ tự hoặc item bị xóa:

```tsx
<motion.div layout key={device.id}>
  <DeviceCard device={device} />
</motion.div>
```

---

## Page Transition (nếu cần)

Chỉ dùng nếu design có yêu cầu rõ ràng — mặc định không animate page transition:

```tsx
// Wrap Outlet nếu cần page transition
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  );
}
```

---

## Duration chuẩn

| Loại animation | Duration |
|----------------|----------|
| Micro feedback (button press, icon) | `0.1s` |
| Element mount/unmount | `0.2s` |
| Panel slide in (Sheet, Sidebar) | `0.25s` |
| Page transition | `0.15s` |
| Stagger child delay | `0.05s` per item |

**Không dùng duration > 0.4s** — cảm giác chậm, không phù hợp app quản lý.

---

## Không làm

```tsx
// ❌ Animate mọi thứ — gây distraction
<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
  Lưu
</motion.button>

// ❌ Duration quá dài
transition={{ duration: 0.8, ease: "easeInOut" }}

// ❌ CSS transition + Framer Motion cùng lúc
<motion.div animate={{ opacity: 1 }} style={{ transition: "all 0.3s" }}>

// ❌ Animate data list khi re-filter (jarring UX)
// Nếu user search → data thay đổi → stagger lại gây confusion
```

---

## Rules tóm tắt

| Rule | |
|------|-|
| Chỉ dùng Framer Motion | Không CSS transition thủ công |
| Animation phải có mục đích UX | Không decoration |
| Duration tối đa 0.4s | App quản lý — nhanh là ưu tiên |
| AnimatePresence cho mount/unmount | Wrap đúng chỗ |
| Stagger chỉ initial load | Không stagger sau filter/search |
| Layout animation cho reorder | Dùng `layout` prop |
