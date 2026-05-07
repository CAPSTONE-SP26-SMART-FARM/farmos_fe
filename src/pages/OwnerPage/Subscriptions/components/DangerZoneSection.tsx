import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { SubscriptionResType } from "@/schemaValidatation/subscription";
import { Trash2 } from "lucide-react";

interface DangerZoneSectionProps {
  subscription: SubscriptionResType;
  onOpenCancel: () => void;
}

function DangerZoneSection({
  subscription,
  onOpenCancel,
}: DangerZoneSectionProps) {
  const canCancel =
    subscription.status === "ACTIVE" || subscription.status === "PENDING";

  if (!canCancel) return null;

  return (
    <Accordion
      type="single"
      collapsible
      className="rounded-lg border border-dashed"
    >
      <AccordionItem
        value="danger"
        className="border-b-0"
      >
        <AccordionTrigger className="px-4 text-sm text-muted-foreground hover:no-underline">
          Tùy chọn nâng cao
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-destructive">
                Hủy đăng ký
              </p>
              <p className="text-xs text-muted-foreground">
                Hủy gói sẽ dừng các dịch vụ trả phí ngay sau khi xác nhận.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={onOpenCancel}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hủy đăng ký
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default DangerZoneSection;
