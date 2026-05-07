import type { AxiosError } from "axios";

const VIETNAMESE_CHAR_PATTERN =
  /[a-zA-Z]*[\u00C0-\u024F\u1E00-\u1EFF][a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]*/;

const ENGLISH_ALPHA_PATTERN = /[A-Za-z]/;

const BACKEND_ERROR_MAP: Record<string, string> = {
  // ── General / HTTP ──────────────────────────────────────────────────
  unauthorized: "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.",
  forbidden: "Bạn không có quyền thực hiện thao tác này.",
  "forbidden resource": "Bạn không có quyền truy cập tài nguyên này.",
  "access denied": "Bạn không có quyền truy cập.",
  "invalid credentials": "Email hoặc mật khẩu không chính xác.",
  "invalid token": "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
  "token expired": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "refresh token expired":
    "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "no refresh token available":
    "Không tìm thấy thông tin phiên đăng nhập. Vui lòng đăng nhập lại.",
  "network error": "Không thể kết nối tới máy chủ. Vui lòng thử lại.",
  "request timeout": "Yêu cầu bị quá thời gian. Vui lòng thử lại.",
  "internal server error": "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.",
  "an error occurred, please try again later.":
    "Đã xảy ra lỗi, vui lòng thử lại sau.",
  "too many requests": "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
  "the requested resource was not found.":
    "Tài nguyên yêu cầu không được tìm thấy.",
  "resource not found.": "Tài nguyên không tồn tại.",
  "data has been modified, please reload.":
    "Dữ liệu đã bị thay đổi, vui lòng tải lại.",

  // ── Auth ─────────────────────────────────────────────────────────────
  "invalid otp code.": "Mã OTP không hợp lệ.",
  "otp code has expired.": "Mã OTP đã hết hạn.",
  "failed to send otp, please try again.":
    "Gửi mã OTP thất bại, vui lòng thử lại.",
  "email is already in use.": "Email đã được sử dụng.",
  "email does not exist in the system.": "Email không tồn tại trong hệ thống.",
  "refresh token has already been used or is invalid.":
    "Refresh token đã được sử dụng hoặc không hợp lệ.",
  "you do not have permission to access this resource.":
    "Bạn không có quyền truy cập.",
  "invalid totp code.": "Mã TOTP không hợp lệ.",
  "two-factor authentication is already enabled.":
    "Xác thực 2 yếu tố đã được bật trước đó.",
  "two-factor authentication is not enabled.":
    "Xác thực 2 yếu tố chưa được bật.",
  "please provide either a totp code or otp code.":
    "Vui lòng cung cấp mã TOTP hoặc mã OTP.",
  "user not found.": "Không tìm thấy người dùng.",
  "incorrect password.": "Mật khẩu không chính xác.",
  "failed to retrieve information from google.":
    "Không thể lấy thông tin từ Google.",
  "password and confirm password must match":
    "Mật khẩu và mật khẩu xác nhận phải giống nhau.",

  // ── Doctor ───────────────────────────────────────────────────────────
  "this license number is already registered by another doctor.":
    "Số giấy phép này đã được đăng ký bởi bác sĩ khác.",
  "doctor profile not found. please create your profile first.":
    "Không tìm thấy hồ sơ bác sĩ. Vui lòng tạo hồ sơ trước.",
  "doctor registration request not found.":
    "Không tìm thấy yêu cầu đăng ký bác sĩ.",
  "reason is required when rejecting or suspending a request.":
    "Lý do là bắt buộc khi từ chối hoặc tạm ngưng yêu cầu.",
  "cannot set the status back to pending.":
    "Không thể đặt lại trạng thái về chờ duyệt.",
  "failed to send notification email.": "Gửi email thông báo thất bại.",
  "the selected doctor is not active or does not exist.":
    "Bác sĩ được chọn không hoạt động hoặc không tồn tại.",
  "the selected owner is not active or does not exist.":
    "Chủ trang trại được chọn không hoạt động hoặc không tồn tại.",
  "this doctor is already assigned to this owner.":
    "Bác sĩ này đã được gắn cho chủ trang trại này.",
  "assignment record not found.": "Không tìm thấy thông tin gán.",

  // ── Farm Management ──────────────────────────────────────────────────
  "owner already has a farm. cannot create more than one.":
    "Chủ trang trại đã có nông trại. Không thể tạo thêm.",
  "farm not found.": "Không tìm thấy nông trại.",
  "farm code already exists.": "Mã nông trại đã tồn tại.",

  // ── Farm Member ──────────────────────────────────────────────────────
  "role must be farmer or manager.": "Vai trò phải là farmer hoặc manager.",
  "farm member not found.": "Không tìm thấy thành viên nông trại.",
  "this user is already a member of the specified farm.":
    "Người dùng này đã là thành viên của nông trại được chỉ định.",

  // ── Zone Management ──────────────────────────────────────────────────
  "zone not found.": "Không tìm thấy khu vực.",
  "the zone area cannot exceed the total available area of the farm.":
    "Diện tích khu vực không được vượt quá tổng diện tích có sẵn của trang trại.",
  "the user account is not active or does not have the proper authorization.":
    "Tài khoản người dùng không hoạt động hoặc không có quyền truy cập.",
  "the manager is not assigned to this zone.":
    "Người quản lý không được phân công cho khu vực này.",
  "cannot remove the primary manager. please assign a new primary manager first.":
    "Không thể xóa người quản lý chính. Vui lòng cập nhật người quản lý chính khác trước.",
  "only the primary manager can create crop seasons for this zone.":
    "Chỉ có quản lý chính mới có thể tạo mùa vụ cho khu vực này.",
  "user not has permission to manage this zone":
    "Bạn không có quyền truy cập để quản lý zone này.",
  "user not has permission to access this feature":
    "Bạn không có quyền truy cập vào chức năng này.",

  // ── Crop Season ──────────────────────────────────────────────────────
  "plant date must be at least 1 month from now.":
    "Ngày xuống giống dự kiến phải trước ít nhất 1 tháng kể từ hiện tại.",
  "plant date must be at least 1 month from now":
    "Ngày xuống giống dự kiến phải trước ít nhất 1 tháng kể từ hiện tại.",
  "expected harvest date must be at least 1 month after the plant date.":
    "Ngày thu hoạch dự kiến phải sau ít nhất 1 tháng kể từ ngày xuống giống.",
  "expected harvest date must be at least 1 month after the plant date":
    "Ngày thu hoạch dự kiến phải sau ít nhất 1 tháng kể từ ngày xuống giống.",
  "crop season not found.": "Không tìm thấy mùa vụ.",
  "crop season can only be updated when its status is 'planning'.":
    "Chỉ có thể cập nhật mùa vụ khi trạng thái là 'planning'.",
  "the crop season area cannot exceed the total available area of the zone.":
    "Diện tích mùa vụ không được vượt quá tổng diện tích có sẵn của khu vực.",
  "production request not found.": "Không tìm thấy yêu cầu sản xuất.",
  "date must be in yyyy-mm-dd format": "Ngày phải có định dạng YYYY-MM-DD.",
  "no milestone found in crop season.":
    "Không tìm thấy mốc sản xuất trong mùa vụ.",
  "no employee task found in milestone.":
    "Không tìm thấy công việc nhân viên trong mốc sản xuất.",
  "no farmer assigned to task in milestone.":
    "Không có nông dân được gán cho công việc trong mốc sản xuất.",

  // ── Production Milestone ─────────────────────────────────────────────
  "production milestone not found.": "Không tìm thấy mốc sản xuất.",
  "you do not have permission to access this production milestone.":
    "Bạn không có quyền truy cập mốc sản xuất này.",
  "this milestone order already exists for the crop season.":
    "Thứ tự mốc này đã tồn tại cho mùa vụ.",
  "a milestone with this stage name already exists for the crop season.":
    "Đã có mốc với tên giai đoạn này trong mùa vụ.",
  "expected start date must be before expected end date.":
    "Ngày bắt đầu dự kiến phải trước ngày kết thúc dự kiến.",
  "each stage expected start date must be after the previous stage expected end date (yyyy-mm-dd).":
    "Ngày bắt đầu dự kiến của giai đoạn phải sau ngày kết thúc dự kiến của giai đoạn trước (YYYY-MM-DD).",
  "actual start date must be before actual end date.":
    "Ngày bắt đầu thực tế phải trước ngày kết thúc thực tế.",
  "milestones can only be created while the crop season is in planning.":
    "Chỉ có thể tạo mốc sản xuất khi mùa vụ đang ở trạng thái lên kế hoạch.",
  "milestones cannot be updated in the current crop season status.":
    "Không thể cập nhật mốc sản xuất với trạng thái mùa vụ hiện tại.",
  "when the crop season is approved, only actualstartdate, actualenddate, and status may be updated.":
    "Khi mùa vụ đã duyệt, chỉ được cập nhật ngày bắt đầu thực tế, ngày kết thúc thực tế và trạng thái.",
  "milestones can only be deleted while the crop season is in planning.":
    "Chỉ có thể xóa mốc sản xuất khi mùa vụ đang ở trạng thái lên kế hoạch.",
  "expectedstartdate must be before expectedenddate":
    "Ngày bắt đầu dự kiến phải trước ngày kết thúc dự kiến.",
  "duplicate milestoneorder in items":
    "Trùng thứ tự mốc sản xuất trong danh sách.",
  "duplicate stagename in items": "Trùng tên giai đoạn trong danh sách.",
  "each stage expectedstartdate must be after the previous stage expectedenddate (yyyy-mm-dd)":
    "Ngày bắt đầu dự kiến của giai đoạn phải sau ngày kết thúc dự kiến của giai đoạn trước (YYYY-MM-DD).",
  "at least one field must be provided":
    "Vui lòng cung cấp ít nhất một trường dữ liệu.",
  "actualstartdate must be before actualenddate":
    "Ngày bắt đầu thực tế phải trước ngày kết thúc thực tế.",
  "expected yyyy-mm-dd": "Định dạng phải là YYYY-MM-DD.",

  // ── IoT Device ───────────────────────────────────────────────────────
  "iot device not found.": "Không tìm thấy thiết bị IoT.",
  "this mac address is already registered.": "Địa chỉ MAC này đã được đăng ký.",
  "cannot remove or change type: this is the last device of this module type on the farm.":
    "Không thể xóa hoặc đổi loại: đây là thiết bị cuối cùng của loại module này trên trang trại.",
  "only board_module devices can be assigned to a production milestone.":
    "Chỉ thiết bị loại board_module mới được gắn vào mốc sản xuất.",
  "zone does not match the crop season zone of this milestone.":
    "Zone không khớp với zone của mùa vụ/mốc sản xuất này.",
  "this iot device is already assigned to this milestone.":
    "Thiết bị IoT đã được gắn vào mốc sản xuất này.",
  "this iot device is not currently assigned to this milestone.":
    "Thiết bị IoT hiện không được gắn vào mốc sản xuất này.",
  "iot device assignments can only be changed while the crop season is in planning.":
    "Chỉ có thể gắn/gỡ thiết bị IoT khi mùa vụ đang ở trạng thái lên kế hoạch.",
  "batch must include board_module, lora_module, and wifi_module.":
    "Batch phải có đủ board_module, lora_module và wifi_module.",
  "batch must contain exactly one board_module (primary parent).":
    "Batch phải có đúng 1 board_module (thiết bị cha).",
  "endat must be after startat.": "endAt phải sau startAt.",
  "this iot board is not available in the requested time window.":
    "Board IoT không khả dụng trong khoảng thời gian đã chọn.",
  "only board_module iot devices can be used for this operation.":
    "Chỉ thiết bị IoT loại board_module mới dùng được cho thao tác này.",
  "sensors for this iot kit have already been locked.":
    "Bộ sensor của kit này đã được khóa trước đó.",
  "this iot board kit must have exactly 4 sensors (one of each required type) before locking.":
    "Board kit phải có đúng 4 sensor (mỗi loại required đúng 1) trước khi khóa.",
  "iot device assignment not found.":
    "Không tìm thấy bản ghi gắn thiết bị IoT vào mốc sản xuất.",
  "invalid mac address format": "Địa chỉ MAC không đúng định dạng.",
  "duplicate mac address in batch": "Trùng địa chỉ MAC trong batch.",

  // ── Sensor ───────────────────────────────────────────────────────────
  "sensor not found.": "Không tìm thấy sensor.",
  "sensors are locked for this iot kit and cannot be modified.":
    "Bộ sensor của kit này đã bị khóa và không thể chỉnh sửa.",
  "sensor does not belong to the assigned iot board.":
    "Sensor không thuộc board kit đã được gắn vào assignment này.",
  "sensor is already bound to this assignment.":
    "Sensor đã được bind vào assignment này.",
  "sensor is not currently bound to this assignment.":
    "Sensor hiện không được bind vào assignment này.",
  "minvalue and maxvalue must be provided together":
    "minValue và maxValue phải được cung cấp cùng nhau.",
  "minvalue must be <= maxvalue": "minValue phải nhỏ hơn hoặc bằng maxValue.",

  // ── Sensor Template ──────────────────────────────────────────────────
  "sensor template not found.": "Không tìm thấy mẫu cảm biến.",
  "a sensor template with this name already exists.":
    "Tên mẫu cảm biến đã tồn tại.",
  "you do not have permission to access this sensor template.":
    "Bạn không có quyền truy cập mẫu cảm biến này.",
  "duplicate sensor model line in template items (same model name).":
    "Trùng dòng mẫu cảm biến (cùng tên model).",
  "maximum threshold must be greater than or equal to minimum.":
    "Ngưỡng tối đa phải lớn hơn hoặc bằng ngưỡng tối thiểu.",
  "optimal maximum must be greater than or equal to optimal minimum.":
    "Tối ưu tối đa phải lớn hơn hoặc bằng tối ưu tối thiểu.",
  "optimal range must lie within min and max thresholds.":
    "Khoảng tối ưu phải nằm trong min và max.",

  // ── Sensor Threshold ─────────────────────────────────────────────────
  "this sensor type is not eligible for thresholds.":
    "Loại sensor này không hỗ trợ threshold.",
  "this sensor type is not bound in the assignment.":
    "Loại sensor này không có sensor nào đang bind trong assignment.",
  "sensor threshold already exists.":
    "Threshold cho loại sensor này đã tồn tại.",
  "sensor threshold not found.":
    "Không tìm thấy threshold cho loại sensor này.",
  "optimal values must be within the sensor min/max range.":
    "Giá trị optimal phải nằm trong khoảng min/max của sensor.",
  "optimalmin must be <= optimalmax":
    "Optimal min phải nhỏ hơn hoặc bằng optimal max.",

  // ── Employee Task Template ───────────────────────────────────────────
  "employee task template not found.":
    "Không tìm thấy mẫu công việc nhân viên.",
  "an employee task template with this name already exists.":
    "Đã tồn tại mẫu công việc nhân viên với tên này.",
  "you do not have permission to access this employee task template.":
    "Bạn không có quyền truy cập mẫu công việc nhân viên này.",
  "duplicate task title in items": "Trùng tiêu đề công việc trong danh sách.",

  // ── Milestone Template for Crop Season ───────────────────────────────
  "crop season milestone template not found.":
    "Không tìm thấy mẫu mốc sản xuất cho mùa vụ.",
  "a crop season milestone template with this name already exists.":
    "Đã tồn tại mẫu mốc sản xuất cho mùa vụ với tên này.",
  "you do not have permission to access this template.":
    "Bạn không có quyền truy cập mẫu này.",

  // ── Sensor Reading ───────────────────────────────────────────────────
  "you are not the owner of this farm.":
    "Bạn không phải chủ của trang trại này.",
  "you are not an active member of this farm.":
    "Bạn không phải thành viên đang hoạt động của trang trại này.",

  // ── Credit / Subscription / Invoice ──────────────────────────────────
  "service package not found.": "Không tìm thấy gói dịch vụ.",
  "service package is not active.": "Gói dịch vụ không còn hoạt động.",
  "credit record not found.": "Không tìm thấy thông tin credit.",
  "insufficient credits.": "Số dư credit không đủ.",
  "feature not found.": "Không tìm thấy feature.",
  "feature code already exists.": "Mã feature đã tồn tại.",
  "feature code does not exist in featuremenu.":
    "Mã feature không tồn tại trong FeatureMenu.",
  "invoice not found.": "Không tìm thấy hoá đơn.",
  "invoice is not in a payable status.":
    "Hoá đơn không ở trạng thái có thể thanh toán.",
  "you do not have permission to access this invoice.":
    "Bạn không có quyền truy cập hoá đơn này.",
  "transaction not found.": "Không tìm thấy giao dịch.",
  "invalid webhook signature.": "Chữ ký webhook không hợp lệ.",
  "invoice already paid.": "Hoá đơn đã được thanh toán.",
  "subscription not found.": "Không tìm thấy đăng ký.",
  "owner already has an active subscription.":
    "Chủ trang trại đã có đăng ký đang hoạt động.",
  "plan has no active version.":
    "Gói đăng ký chưa có phiên bản nào được kích hoạt.",
  "subscription is not active.":
    "Đăng ký không hoạt động, không thể thực hiện hành động này.",
  "you do not have permission to access this subscription.":
    "Bạn không có quyền truy cập đăng ký này.",
  "subscription cannot be renewed in its current status.":
    "Đăng ký không thể gia hạn với trạng thái hiện tại.",
  "subscription plan not found.": "Không tìm thấy gói đăng ký.",
  "plan code already exists.": "Mã gói đăng ký đã tồn tại.",
  "plan version not found.": "Không tìm thấy phiên bản gói.",
  "error.subscriptionnotfound": "Không tìm thấy đăng ký.",
  "error.owneralreadyhasactivesubscription":
    "Chủ trang trại đã có đăng ký đang hoạt động.",
  "error.planhasnoactiveversion":
    "Gói đăng ký chưa có phiên bản nào được kích hoạt.",
  "error.planversionnotactive": "Phiên bản gói chưa được kích hoạt.",
  "error.subscriptionnotactive":
    "Đăng ký không hoạt động, không thể thực hiện hành động này.",
  "error.subscriptionaccessdenied": "Bạn không có quyền truy cập đăng ký này.",
  "error.subscriptioncannotrenew":
    "Đăng ký không thể gia hạn với trạng thái hiện tại.",
  "error.plannotfound": "Không tìm thấy gói đăng ký.",
  "error.plancodealreadyexists": "Mã gói đăng ký đã tồn tại.",
  "error.planversionnotfound": "Không tìm thấy phiên bản gói.",
  "error.invalidfeaturecode": "Mã tính năng không tồn tại trong hệ thống.",

  // ── IoT Kit Add-on ──────────────────────────────────────────────────
  "error.iotkitnotfound": "Không tìm thấy bộ Kit IoT.",
  "error.iotkitcodealreadyexists": "Mã bộ Kit IoT đã tồn tại.",
  "error.iotkitnotactive":
    "Bộ Kit IoT đã ngừng bán. Vui lòng tải lại danh sách.",
  "error.iotkitalreadyarchived": "Bộ Kit IoT đã được lưu trữ.",
  "error.iotkitalreadyactive": "Bộ Kit IoT đang hoạt động.",
  "error.iotkitimmutablefields":
    "Không thể đổi số bộ / loại board khi đã có đơn đã thanh toán.",
  "error.iotkitpurchasequantityinvalid": "Số lượng mua không hợp lệ.",
  "error.iotkitordernotfound": "Không tìm thấy đơn mua bộ Kit IoT.",
  "error.iotkitorderaccessdenied": "Bạn không có quyền truy cập đơn này.",
  "error.iotkitordernumbergeneration":
    "Không tạo được mã đơn. Vui lòng thử lại.",
  "error.ownernoactivesubscription":
    "Bạn cần có gói đăng ký đang hoạt động để xem hạn mức bộ Kit IoT.",
  "error.cannotdeleteprovisioneddevice":
    "Không thể xóa thiết bị đang được cấp cho chủ trang trại. Vui lòng thu hồi trước.",
  "error.insufficientiotdevicesforkit":
    "Kho thiết bị IoT không đủ để đáp ứng đơn kit này. Vui lòng thử lại sau.",
  "error.insufficientiotdevices":
    "Kho thiết bị IoT không đủ để đáp ứng gói đăng ký này. Vui lòng thử lại sau.",
  "error.subscriptionexpiringsoon":
    "Gói đăng ký còn dưới 1 tháng là hết hạn. Vui lòng gia hạn trước khi mua thêm Kit IoT.",

  // ── Raw Error.* keys (missing i18n, sent as-is) ──────────────────────
  tasktitleduplicate: "Tiêu đề công việc đã tồn tại trong mốc sản xuất này.",
  macaddressrequiredforwifimodule:
    "Địa chỉ MAC là bắt buộc cho thiết bị wifi_module.",
  iotdevicetemplatenamealreadyexists: "Tên mẫu thiết bị IoT đã tồn tại.",
  iotdevicetemplateduplicateitem: "Trùng dòng trong mẫu thiết bị IoT.",
  dailylogalreadysubmittedtoday: "Nhật ký hôm nay đã được gửi.",
  "dailylogmilestonezone missing": "Mốc sản xuất chưa được gắn khu vực.",
  dailylogcropseasonnotactive: "Mùa vụ chưa ở trạng thái hoạt động.",
  dailylogmilestonenotinprogress:
    "Mốc sản xuất chưa ở trạng thái đang thực hiện.",
  ticketinvalidincidentseverity: "Mức độ nghiêm trọng sự cố không hợp lệ.",
  ticketalreadyassigned: "Ticket đã được phân công.",
  ticketincidentendedcannotaccept:
    "Không thể nhận ticket vì sự cố đã kết thúc.",
  ticketmessageinvalidattachments: "File đính kèm không hợp lệ.",

  // ── Zod Error.* keys (from schema refinements, sent as-is) ───────────
  "error.reasonrequired":
    "Lý do là bắt buộc khi từ chối hoặc tạm ngưng yêu cầu.",
  "error.macaddressrequiredforwifimodule":
    "Địa chỉ MAC là bắt buộc cho thiết bị wifi_module.",
  "error.iotdevicebatchinvalidboardcount":
    "Batch phải có đúng 1 board_module (thiết bị cha).",
  "error.missingrequireddevicetypes":
    "Batch phải có đủ board_module, lora_module và wifi_module.",
  "error.sensortemplatethresholdminmaxorder":
    "Ngưỡng tối đa phải lớn hơn hoặc bằng ngưỡng tối thiểu.",
  "error.sensortemplatethresholdoptimalorder":
    "Tối ưu tối đa phải lớn hơn hoặc bằng tối ưu tối thiểu.",
  "error.sensortemplatethresholdoptimalwithinrange":
    "Khoảng tối ưu phải nằm trong min và max.",
  "error.nothavemilestoneincropseason":
    "Không tìm thấy mốc sản xuất trong mùa vụ.",
  "error.nothaveemployeetaskinmilestone":
    "Không tìm thấy công việc nhân viên trong mốc sản xuất.",
  "error.noassignfarmertotask":
    "Không có nông dân được gán cho công việc trong mốc sản xuất.",

  // ── Zod v4 built-in validation messages ──────────────────────────────
  required: "Trường này là bắt buộc.",
  "invalid iso datetime": "Ngày giờ không đúng định dạng ISO.",
  "invalid datetime": "Ngày giờ không đúng định dạng.",
  "invalid iso date": "Ngày không đúng định dạng.",
  "invalid date": "Ngày không đúng định dạng.",
  "invalid email address": "Email không đúng định dạng.",
  "invalid email": "Email không đúng định dạng.",
  "invalid uuid": "Định dạng ID không hợp lệ.",
  "invalid url": "Đường dẫn URL không hợp lệ.",
  "invalid ip address": "Địa chỉ IP không hợp lệ.",
  "invalid ip": "Địa chỉ IP không hợp lệ.",
  invalid: "Dữ liệu không đúng định dạng.",
  "invalid input": "Dữ liệu nhập vào không hợp lệ.",
  "invalid type": "Kiểu dữ liệu không hợp lệ.",
  "number must be greater than 0": "Giá trị phải lớn hơn 0.",
  "number must be greater than or equal to 0":
    "Giá trị phải lớn hơn hoặc bằng 0.",
  "number must be less than or equal to 100":
    "Giá trị phải nhỏ hơn hoặc bằng 100.",
  "expected integer, received float": "Giá trị phải là số nguyên.",

  // ── Module 5 — Tracking / Field-locking ──────────────────────────────
  "error.cropseasonlockedplanfield":
    "Trường này đã được khóa sau khi phê duyệt kế hoạch.",
  "error.cropseasonoperationalupdatenotallowed":
    "Chỉ chỉnh được trường vận hành khi mùa vụ đã duyệt hoặc đang hoạt động.",
  "error.productionmilestoneupdateoperationalfieldsonly":
    "Chỉ có thể cập nhật trường thực tế sau khi kế hoạch được duyệt.",
  "error.milestoneactualdaterequiresactiveseason":
    "Ngày thực tế chỉ sửa được khi mùa vụ đang hoạt động (active).",
  "error.taskplanfieldlocked":
    "Không thể sửa tiêu đề/mô tả/độ ưu tiên của công việc kế hoạch sau khi phê duyệt.",
  "error.taskassignee locked":
    "Không thể đổi người thực hiện khi công việc đã hoàn thành/hủy.",
  "error.trackingconfiglocked":
    "Cấu hình theo dõi chỉ có thể thay đổi khi mùa vụ đang ở trạng thái lập kế hoạch.",
  "error.trackingfieldnotwhitelisted":
    "Trường này không nằm trong danh sách có thể theo dõi.",
  "error.trackingforbidden":
    "Bạn không có quyền xem dữ liệu theo dõi của mùa vụ này.",
};

const normalizeMessage = (message: string) =>
  message.trim().replace(/\s+/g, " ").toLowerCase();

const looksVietnamese = (message: string) =>
  VIETNAMESE_CHAR_PATTERN.test(message);

export const translateBackendMessage = (message: string) => {
  const normalized = normalizeMessage(message);

  if (!normalized) {
    return "Đã xảy ra lỗi. Vui lòng thử lại.";
  }

  if (looksVietnamese(message)) {
    return message;
  }

  if (BACKEND_ERROR_MAP[normalized]) {
    return BACKEND_ERROR_MAP[normalized];
  }

  if (/not found|does not exist|no such/i.test(message)) {
    return "Không tìm thấy dữ liệu yêu cầu.";
  }

  if (
    /already exists|duplicate|unique constraint|must be unique/i.test(message)
  ) {
    return "Dữ liệu đã tồn tại.";
  }

  // ── Parameterized Zod messages ─────────────────────────────────────
  const stringMinMatch = message.match(
    /string must contain at least (\d+) character/i,
  );
  if (stringMinMatch) {
    return `Phải có ít nhất ${stringMinMatch[1]} ký tự.`;
  }

  const stringMaxMatch = message.match(
    /string must contain at most (\d+) character/i,
  );
  if (stringMaxMatch) {
    return `Không được vượt quá ${stringMaxMatch[1]} ký tự.`;
  }

  const stringExactMatch = message.match(
    /string must contain exactly (\d+) character/i,
  );
  if (stringExactMatch) {
    return `Phải có đúng ${stringExactMatch[1]} ký tự.`;
  }

  const arrayMinMatch = message.match(
    /array must contain at least (\d+) element/i,
  );
  if (arrayMinMatch) {
    return `Danh sách phải có ít nhất ${arrayMinMatch[1]} phần tử.`;
  }

  const numGteMatch = message.match(
    /number must be greater than or equal to ([\d.]+)/i,
  );
  if (numGteMatch) {
    return `Giá trị phải lớn hơn hoặc bằng ${numGteMatch[1]}.`;
  }

  const numGtMatch = message.match(/number must be greater than ([\d.]+)/i);
  if (numGtMatch) {
    return `Giá trị phải lớn hơn ${numGtMatch[1]}.`;
  }

  const numLteMatch = message.match(
    /number must be less than or equal to ([\d.]+)/i,
  );
  if (numLteMatch) {
    return `Giá trị phải nhỏ hơn hoặc bằng ${numLteMatch[1]}.`;
  }

  if (/^expected .+, received/i.test(message)) {
    return "Kiểu dữ liệu không hợp lệ.";
  }

  if (/^invalid enum value/i.test(message)) {
    return "Giá trị không nằm trong danh sách cho phép.";
  }

  if (/^unrecognized key/i.test(message)) {
    return "Dữ liệu chứa trường không hợp lệ.";
  }

  if (/required|must not be empty|should not be empty/i.test(message)) {
    return "Vui lòng nhập đầy đủ các trường bắt buộc.";
  }

  if (
    /invalid|validation|unprocessable|format|malformed|must be/i.test(message)
  ) {
    return "Dữ liệu không hợp lệ. Vui lòng kiểm tra và thử lại.";
  }

  if (/timeout|timed out|econnaborted/i.test(message)) {
    return "Kết nối quá thời gian. Vui lòng thử lại.";
  }

  if (/internal server error|server error/i.test(message)) {
    return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.";
  }

  if (/too many requests|rate limit/i.test(message)) {
    return "Bạn thao tác quá nhanh. Vui lòng thử lại sau.";
  }

  if (/network error|failed to fetch|connection refused/i.test(message)) {
    return "Không thể kết nối tới máy chủ. Vui lòng thử lại.";
  }

  if (ENGLISH_ALPHA_PATTERN.test(message)) {
    return "Đã xảy ra lỗi từ hệ thống. Vui lòng thử lại.";
  }

  return message;
};

export const getApiErrorMessageVi = (
  error: unknown,
  fallbackMessage = "Đã xảy ra lỗi. Vui lòng thử lại.",
) => {
  const axiosError = error as AxiosError<{
    message?: string | string[];
  }>;

  const rawMessage = axiosError?.response?.data?.message;

  if (Array.isArray(rawMessage)) {
    const joined = rawMessage.join(". ");
    return translateBackendMessage(joined || fallbackMessage);
  }

  if (typeof rawMessage === "string" && rawMessage.trim()) {
    return translateBackendMessage(rawMessage);
  }

  if (error instanceof Error && error.message) {
    return translateBackendMessage(error.message);
  }

  return fallbackMessage;
};
