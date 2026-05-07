import StatusBanner from "@/components/common/StatusBanner";
import type { InvoiceType } from "@/schemaValidatation/invoice";
import type { SubscriptionResType } from "@/schemaValidatation/subscription";
import { differenceInCalendarDays } from "date-fns";

interface SubscriptionBannerCascadeProps {
  subscription: SubscriptionResType;
  unpaidInvoice?: InvoiceType;
  paymentPending?: boolean;
  paymentOrderCode?: string | number | null;
  onPayNow?: (invoiceId: string) => void;
  onContactSupport?: () => void;
}

function SubscriptionBannerCascade({
  subscription,
  unpaidInvoice,
  paymentPending,
  paymentOrderCode,
  onPayNow,
  onContactSupport,
}: SubscriptionBannerCascadeProps) {
  if (subscription.status === "SUSPENDED") {
    return (
      <StatusBanner
        variant="danger"
        title="Gói đăng ký đang bị tạm ngưng"
        description="Liên hệ hỗ trợ để biết thêm chi tiết và khôi phục dịch vụ."
        action={
          onContactSupport
            ? { label: "Liên hệ hỗ trợ", onClick: onContactSupport }
            : undefined
        }
      />
    );
  }

  if (subscription.status === "EXPIRED") {
    const daysAgo = subscription.expiresAt
      ? Math.abs(
          differenceInCalendarDays(
            new Date(subscription.expiresAt),
            new Date(),
          ),
        )
      : 0;
    return (
      <StatusBanner
        variant="danger"
        title={
          daysAgo > 0
            ? `Đã hết hạn ${daysAgo} ngày trước`
            : "Gói đăng ký đã hết hạn"
        }
        description="Đăng ký gói mới để tiếp tục sử dụng dịch vụ đầy đủ."
      />
    );
  }

  if (unpaidInvoice) {
    return (
      <StatusBanner
        variant="warning"
        title="Có hóa đơn chưa thanh toán"
        description={`Hóa đơn ${unpaidInvoice.invoiceNumber} đang chờ thanh toán.`}
        action={
          onPayNow
            ? {
                label: "Thanh toán ngay",
                onClick: () => onPayNow(unpaidInvoice.id),
              }
            : undefined
        }
      />
    );
  }

  if (subscription.expiresAt && subscription.status === "ACTIVE") {
    const daysLeft = differenceInCalendarDays(
      new Date(subscription.expiresAt),
      new Date(),
    );
    if (daysLeft >= 0 && daysLeft <= 14) {
      return (
        <StatusBanner
          variant="info"
          title={`Sắp hết hạn trong ${daysLeft} ngày`}
          description="Đăng ký gói mới trước khi hết hạn để tránh gián đoạn dịch vụ."
        />
      );
    }
  }

  if (paymentPending) {
    return (
      <StatusBanner
        variant="info"
        title="Đang chờ xác nhận từ PayOS"
        description={
          paymentOrderCode
            ? `Đơn thanh toán #${paymentOrderCode} đang được xử lý. Hệ thống sẽ cập nhật tự động.`
            : "Đơn thanh toán đang được xử lý. Hệ thống sẽ cập nhật tự động."
        }
      />
    );
  }

  return null;
}

export default SubscriptionBannerCascade;
