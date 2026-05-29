import StatusBanner from "@/components/common/StatusBanner";

interface Props {
  total: number;
  assigned: number;
}

function TasksCompletionBanner({ total, assigned }: Props) {
  if (total === 0) return null;

  const remaining = Math.max(0, total - assigned);
  const isComplete = remaining === 0;

  if (isComplete) {
    return (
      <StatusBanner
        variant="success"
        title={`Đã tạo ${total} nhiệm vụ · Tất cả đã có người làm`}
        description="Mốc đã sẵn sàng hoàn tất cấu hình."
      />
    );
  }

  return (
    <StatusBanner
      variant="warning"
      title={`Đã tạo ${total} nhiệm vụ · Còn ${remaining} nhiệm vụ chưa có người làm`}
      description="Mời chọn nông dân cho các nhiệm vụ còn lại để có thể hoàn tất mốc."
    />
  );
}

export default TasksCompletionBanner;
