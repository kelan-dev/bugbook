"use client";

import { Button } from "@/components/ui/button";
import ky from "@/lib/ky";
import { NotificationCountData } from "@/lib/types";
import { BellIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

// ################################################################################################

interface NotificationsButtonProps {
  initialData: NotificationCountData;
}

export default function NotificationsButton({
  initialData,
}: NotificationsButtonProps) {
  // Query to get the unread notification count
  const query = useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: () =>
      ky.get("/api/notifications/unread-count").json<NotificationCountData>(),
    refetchInterval: 1000 * 60,
    initialData,
  });

  return (
    <Button
      variant="ghost"
      className="flex items-center justify-start gap-3 py-6"
      title="Notifications"
      asChild
    >
      <Link href="/notifications">
        <div className="relative">
          <BellIcon className="h-5 w-5" />
          {query.data?.unreadCount > 0 && (
            <span className="absolute -right-3 -top-3 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-medium tabular-nums text-primary-foreground">
              {query.data?.unreadCount}
            </span>
          )}
        </div>
        <span className="hidden lg:inline">Notifications</span>
      </Link>
    </Button>
  );
}
