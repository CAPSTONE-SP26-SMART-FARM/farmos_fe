import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RatingTagBadge } from "@/components/common/RatingTagBadge";
import { cn } from "@/lib/utils";
import type { RatingResType } from "@/schemaValidatation/rating";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ShieldOff, Star } from "lucide-react";
import StarRating from "./StarRating";

interface RatingDisplayProps {
  rating: RatingResType | null;
}

// Card hiển thị đánh giá của người tạo ticket sau khi đóng — bao gồm số
// sao và nhận xét. Khi Admin vô hiệu hoá đánh giá, hiển thị strikethrough +
// alert lý do (BR-79).

export default function RatingDisplay({ rating }: RatingDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="h-4 w-4" />
          Đánh giá
        </CardTitle>
        <CardDescription>
          Đánh giá của người tạo ticket sau khi đóng — bao gồm số sao và nhận
          xét.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!rating ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Chưa có đánh giá.
          </p>
        ) : (
          <div
            className={cn(
              "space-y-3",
              rating.invalidatedAt && "opacity-60",
            )}
          >
            {/* Stars */}
            <div className="flex items-center gap-3">
              <StarRating
                value={rating.stars}
                readOnly
                size="lg"
              />
              <span className="text-xs text-muted-foreground">
                {format(new Date(rating.createdAt), "HH:mm dd/MM/yyyy", {
                  locale: vi,
                })}
              </span>
            </div>

            {/* Feedback (BE field `feedback`, không phải `comment`) */}
            {rating.feedback && (
              <div className="rounded-md border bg-muted/30 p-3">
                <p
                  className={cn(
                    "text-sm leading-relaxed whitespace-pre-wrap",
                    rating.invalidatedAt && "line-through",
                  )}
                >
                  {rating.feedback}
                </p>
              </div>
            )}

            {/* Tags (BE schema: any nullable — array string nếu có).
                BE trả snake_case English; RatingTagBadge tự dịch sang tiếng
                Việt + tô màu theo tone (positive xanh / negative đỏ). */}
            {Array.isArray(rating.tags) && rating.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(rating.tags as string[]).map((tag) => (
                  <RatingTagBadge
                    key={tag}
                    tag={tag}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invalidated alert — render bên ngoài opacity wrapper */}
        {rating?.invalidatedAt && (
          <Alert
            variant="default"
            className="mt-3 bg-amber-500/10 border-amber-200"
          >
            <ShieldOff className="h-4 w-4 text-amber-700" />
            <AlertDescription className="text-amber-900">
              <strong>Đánh giá đã bị quản trị viên vô hiệu hoá</strong>
              {" — "}
              {format(
                new Date(rating.invalidatedAt),
                "HH:mm dd/MM/yyyy",
                { locale: vi },
              )}
              {rating.invalidationReason && (
                <span className="block mt-1 text-xs">
                  <strong>Lý do:</strong> {rating.invalidationReason}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
