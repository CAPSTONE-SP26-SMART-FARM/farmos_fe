import { Link } from "react-router";
import { Mail, Phone, Sprout, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type {
  DecisionContextMilestoneType,
  DecisionContextOwnerType,
} from "@/schemaValidatation/iotDeviceAdminOps";

interface Props {
  owner: DecisionContextOwnerType | null;
  milestones: DecisionContextMilestoneType[];
}

export function DecisionOwnerCard({ owner, milestones }: Props) {
  if (!owner) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Chủ trang trại & mùa vụ ảnh hưởng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Thiết bị chưa được gán cho chủ trang trại nào.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            Chủ trang trại & mùa vụ ảnh hưởng
          </CardTitle>
          <Button
            asChild
            variant="link"
            size="sm"
            className="h-auto p-0"
          >
            <Link
              to={`/dashboard/admin/owners/${owner.id}/iot`}
              aria-label={`Xem hồ sơ 360° của ${owner.fullName}`}
            >
              Hồ sơ chủ trang trại 360° →
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {/*
          Mùa vụ ảnh hưởng đặt LÊN ĐẦU: đây là tín hiệu impact admin cần
          thấy trước khi swap/gỡ — quyết định ảnh hưởng đến X mùa vụ này.
          Owner contact info xuống dưới (để liên hệ sau khi quyết định).
        */}
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sprout
              className="h-3.5 w-3.5"
              aria-hidden
            />
            Mùa vụ đang dùng thiết bị ({milestones.length})
          </p>
          {milestones.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Chưa có mùa vụ nào gắn thiết bị này — quyết định không ảnh
              hưởng mùa vụ đang chạy.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {milestones.map((m) => (
                <li
                  key={m.milestoneId}
                  className="space-y-0.5 rounded-md border bg-muted/30 p-2 text-xs"
                >
                  <div className="font-medium">{m.milestoneName}</div>
                  <div className="text-muted-foreground">
                    {m.cropSeasonName} · {m.zoneName}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator />

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Liên hệ chủ trang trại
          </p>
          <div className="flex items-center gap-2 font-medium">
            <User
              className="h-4 w-4 text-muted-foreground"
              aria-hidden
            />
            {owner.fullName}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
            <Button
              asChild
              variant="link"
              className="h-auto px-0 py-0 text-muted-foreground"
            >
              <a href={`mailto:${owner.email}`}>
                <Mail
                  className="mr-1 h-3.5 w-3.5"
                  aria-hidden
                />
                {owner.email}
              </a>
            </Button>
            {owner.phone && (
              <Button
                asChild
                variant="link"
                className="h-auto px-0 py-0 text-muted-foreground"
              >
                <a href={`tel:${owner.phone}`}>
                  <Phone
                    className="mr-1 h-3.5 w-3.5"
                    aria-hidden
                  />
                  {owner.phone}
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
