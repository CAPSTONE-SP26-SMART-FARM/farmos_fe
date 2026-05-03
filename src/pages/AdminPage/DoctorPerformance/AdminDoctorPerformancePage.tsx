import { Navigate } from "react-router";

// Module 3 Wave 4 — Page mock cũ deprecated.
// Sidebar đã ngắt route này (xem `sidebarItemData.ts`). Khi user truy cập
// trực tiếp URL cũ, redirect sang DQS Leaderboard mới (A4).

export default function AdminDoctorPerformancePage() {
  return (
    <Navigate
      to="/dashboard/admin/dqs/leaderboard"
      replace
    />
  );
}
