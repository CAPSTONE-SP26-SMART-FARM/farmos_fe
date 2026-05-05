# Frontend Page Refactor Log

Mỗi file page trong `src/pages/` được giới hạn tối đa 500 dòng. Các component, helper, schema lớn đã được tách ra thành file riêng.

---

## ManagerPage — CropSeasons

**Nguồn gốc:** `ManagerCropSeasonsPage.tsx` (~2794 dòng — file gốc chứa toàn bộ logic)

| File mới | Mô tả |
|---|---|
| `components/helpers.ts` | STATUS_MAP, REQUEST_STATUS_MAP, formatDate, parseBackendDate, formatPickerDate, getMinPlantDate, validateCropSeasonFormDates, getCropSeasonEditMode, canEdit, canSend, MILESTONE_STATUS_META |
| `components/StatusBadge.tsx` | Badge hiển thị trạng thái vụ mùa |
| `components/Field.tsx` | Primitive `Field` và `DatePickerField` dùng trong form |
| `components/CreateCropSeasonScreen.tsx` | Màn hình tạo vụ mùa mới (form đầy đủ) |
| `components/UpdateCropSeasonDialog.tsx` | Dialog cập nhật thông tin vụ mùa |
| `components/SendRequestDialog.tsx` | Dialog gửi yêu cầu phê duyệt lên owner |
| `components/CropSeasonDetailSheet.tsx` | Sheet xem chi tiết vụ mùa (read-only) |
| `components/CropSeasonSummaryCard.tsx` | Card tóm tắt trạng thái vụ mùa hiện tại |
| `components/RequestsHistoryTab.tsx` | Tab lịch sử yêu cầu phê duyệt |
| `components/MilestoneDetailPane.tsx` | Pane chi tiết milestone (gán IoT, sensor readings) |
| `components/MilestonesWithDetailTab.tsx` | Split-view: danh sách milestone + detail pane |
| `components/SensorOverviewTab.tsx` | Tab tổng quan cảm biến: AlertsTable + MilestoneSensorSection |
| `components/IncidentTab.tsx` | Tab sự cố (severity / status maps, danh sách ticket) |
| `components/DailyTasksTab.tsx` | Tab nhật ký task (milestone đang chạy) |
| `components/TrackingDiffSection.tsx` | Bảng so sánh tracking: formatVariance + TrackingDiffSection |
| `components/TrackingLogItem.tsx` | ENTITY_COLOR_MAP, CHANGE_TYPE_MAP, icon helper, TrackingLogItem |
| `components/TrackingLogList.tsx` | Danh sách tracking log nhóm theo ngày |
| `components/ZoneSwitcherCombobox.tsx` | Combobox chọn nhanh khu vực (shadcn Command+Popover) |
| `components/TrackingFilterInputs.tsx` | EntityTypeCombobox + DatePickerInput (bộ lọc tracking) |
| `components/TrackingOperationalView.tsx` | TrackingOperationalView (filter bar + list) + TrackingLogTab (export) |
| `components/HarvestRecordTab.tsx` | Tab thu hoạch: hiển thị ngày dự kiến / thực tế + nút chỉnh sửa |
| `components/HistoryView.tsx` | Danh sách vụ mùa đã hoàn thành / huỷ |
| `components/ZoneLanding.tsx` | Trang chọn khu vực (grid card + motion) |
| `ManagerCropSeasonsPage.tsx` | Thin orchestration: quản lý zoneId, sidebarTab, showCreate |

---

## AdminPage — MilestoneTemplates

**Nguồn gốc:** `MilestoneTemplateForm.tsx` (748 dòng)

| File mới | Mô tả |
|---|---|
| `components/MilestoneStageItem.tsx` | MilestoneStageSchema, MilestoneTemplateFormSchema, MilestoneTemplateFormValues type, createDefaultItem, buildDefaultValues, StageCardContent (drag overlay preview), SortableStageItem (dnd-kit sortable card) |
| `MilestoneTemplateForm.tsx` | Form chính: quản lý DnD context, submit, confirm dialogs (~360 dòng) |

---

## AdminPage — IotTemplates

**Nguồn gốc:** `SensorTemplateForm.tsx` (632 dòng)

| File mới | Mô tả |
|---|---|
| `sensorTemplateSchemas.ts` | SensorItemFormSchema (với cross-field validation), SensorTemplateFormSchema, SensorTemplateFormType, SENSOR_TYPE_LABEL, toNum |
| `components/SensorItemCard.tsx` | Card cấu hình 1 cảm biến: sensorModelName, minValue, maxValue, optimalMin, optimalMax |
| `SensorTemplateForm.tsx` | Form chính: basic info card + danh sách cảm biến (~310 dòng) |

---

## AdminPage — DoctorApplications

**Nguồn gốc:** `DoctorApplicationDetailDialog.tsx` (627 dòng)

| File mới | Mô tả |
|---|---|
| `doctorApplicationHelpers.tsx` | initialsOf, formatDateTime, formatDate, InfoRow, SectionTitle |
| `components/DoctorApplicationActions.tsx` | QuickApproveSuspendButtons (export) + ConfirmInline (local) |
| `DoctorApplicationDetailDialog.tsx` | Dialog chi tiết + form xử lý đơn (~470 dòng) |

---

## AdminPage — Features

**Nguồn gốc:** `AdminFeaturesPage.tsx` (532 dòng)

| File mới | Mô tả |
|---|---|
| `featureTypes.ts` | FormState type, INITIAL_FORM, toCreatePayload, toUpdatePayload, toFormState |
| `components/FeatureFormDialog.tsx` | Dialog tạo / cập nhật feature (nhận props từ page cha) |
| `AdminFeaturesPage.tsx` | Page chính: bảng danh sách + pagination + search (~340 dòng) |

---

## AdminPage — Packages

**Nguồn gốc:** `AdminPackagesPage.tsx` (523 dòng)

| File mới | Mô tả |
|---|---|
| `packageHelpers.ts` | PackageStatus type, SubscriptionPackage type, createPackage, initialPackages, PACKAGE_STATUS_LABEL, formatVnd |
| `AdminPackagesPage.tsx` | Page chính: bảng gói + form inline (~455 dòng) |

---

## DoctorPage — Tickets

**Nguồn gốc:** `DoctorTicketsPage.tsx` (712 dòng)

| File mới | Mô tả |
|---|---|
| `components/CreatePrescriptionDialog.tsx` | Dialog kê đơn thuốc (form medicineName + dosage) |
| `components/TicketDetailPanel.tsx` | Panel chi tiết ticket: thông tin + chat + đơn thuốc + actions; export SEVERITY_LABEL, SEVERITY_VARIANT, STATUS_LABEL, STATUS_VARIANT, ACTIVE_STATUSES |
| `DoctorTicketsPage.tsx` | Page chính: bảng danh sách ticket + phân trang (~195 dòng) |

---

## OwnerPage — CropSeasons

**Nguồn gốc:** `components/ProductionRequestDetailPanel.tsx` (505 dòng), `components/CropSeasonDetailPanel.tsx` (880 dòng)

| File mới | Mô tả |
|---|---|
| `components/productionRequestHelpers.tsx` | SEASON_STATUS_MAP, REQUEST_STATUS_MAP, formatDate, InfoRow, DetailSkeleton |
| `components/ProductionRequestDetailPanel.tsx` | Panel chi tiết yêu cầu phê duyệt: approve/reject flow (~445 dòng) |
| `components/MilestoneIotDetail.tsx` | SENSOR_TYPE_LABELS, formatThresholdText, MilestoneIotDetail (hiển thị thiết bị IoT + cảm biến của mốc) |
| `components/OwnerMilestonesSection.tsx` | Card danh sách mốc sản xuất: bảng expand/collapse + phân trang |
| `components/OwnerRequestsSection.tsx` | Card danh sách yêu cầu phê duyệt: bảng + filter trạng thái + phân trang |
| `components/OwnerTrackingLogTab.tsx` | Tab nhật ký thay đổi: gọi useTrackingLog + bộ lọc (loại đối tượng, khoảng ngày) + TrackingLogList |
| `components/CropSeasonDetailPanel.tsx` | Orchestrator: info card + tabs (Mốc / Yêu cầu / Nhật ký thay đổi) (~240 dòng) |
