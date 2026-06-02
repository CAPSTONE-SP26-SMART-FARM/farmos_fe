import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyTicketBalance } from "@/queries/useTicketV2";
import type { TicketBalancePerCategoryType } from "@/schemaValidatation/ticketV2";

type Variant = "ok" | "low" | "empty";

const variantForTotal = (total: number): Variant => {
  if (total <= 0) return "empty";
  if (total < 5) return "low";
  return "ok";
};

const VARIANT_STYLE: Record<Variant, string> = {
  ok: "border-primary/30 bg-primary/5",
  low: "border-amber-500/40 bg-amber-50",
  empty: "border-destructive/40 bg-destructive/5",
};

const VARIANT_TOTAL_TEXT: Record<Variant, string> = {
  ok: "text-primary",
  low: "text-amber-700",
  empty: "text-destructive",
};

function QuotaCategoryCard({ item }: { item: TicketBalancePerCategoryType }) {
  const variant = variantForTotal(item.total);

  return (
    <div className={cn("rounded-md border p-3", VARIANT_STYLE[variant])}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight">{item.categoryName}</p>
        {variant === "empty" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle
                className="h-4 w-4 shrink-0 text-destructive"
                aria-label="Hết hạn ngạch"
              />
            </TooltipTrigger>
            <TooltipContent>
              Hết hạn ngạch — không thể tạo sự cố mới ở loại này
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          VARIANT_TOTAL_TEXT[variant],
        )}
      >
        {item.total}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">lượt còn lại</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-[10px] font-normal">
          Gói: {item.fromSubscription}
        </Badge>
        <Badge variant="outline" className="text-[10px] font-normal">
          Đã mua thêm: {item.fromPurchased}
        </Badge>
      </div>
    </div>
  );
}

/**
 * Manager-side quota panel for the milestone incident tab.
 *
 * Data source: GET /me/ticket-balance — backend resolves the underlying farm
 * owner from the manager's active zone-manager assignment, then aggregates
 * per-category balance (subscription grant + purchased). Manager is read-only
 * here; quota is consumed when an incident ticket is created (mobile flow).
 */
export function IncidentTicketQuotaPanel() {
  const balanceQuery = useMyTicketBalance();
  const items = balanceQuery.data?.data.data ?? [];

  if (balanceQuery.isLoading) {
    return (
      <section className="rounded-md border bg-muted/20 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Ticket className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Hạn ngạch sự cố</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </section>
    );
  }

  if (balanceQuery.isError) {
    return (
      <section className="rounded-md border bg-muted/20 p-3">
        <p className="text-sm text-muted-foreground">
          Không tải được hạn ngạch sự cố. Mời thử lại sau.
        </p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="rounded-md border bg-muted/20 p-3">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Chưa có hạn ngạch sự cố nào. Liên hệ chủ trang trại để mua thêm.
          </p>
        </div>
      </section>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <section
        className="rounded-md border bg-muted/20 p-3"
        aria-label="Hạn ngạch sự cố theo loại"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Hạn ngạch sự cố theo loại</p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Đã gộp số dư từ gói và mua thêm
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <QuotaCategoryCard key={item.categoryConfigId} item={item} />
          ))}
        </div>
      </section>
    </TooltipProvider>
  );
}

export default IncidentTicketQuotaPanel;
