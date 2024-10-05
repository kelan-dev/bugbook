"use client";

import { Button } from "@/components/ui/button";
import { MessageCountData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import ky from "@/lib/ky";
import Link from "next/link";
import { ChatBubbleIcon } from "@radix-ui/react-icons";

// ################################################################################################

interface MessagesButtonProps {
  initialData: MessageCountData;
}

export default function MessagesButton({ initialData }: MessagesButtonProps) {
  // Query to get the unread message count
  const query = useQuery({
    queryKey: ["unread-messages-count"],
    queryFn: () =>
      ky.get("/api/messages/unread-count").json<MessageCountData>(),
    refetchInterval: 1000 * 60,
    initialData,
  });

  return (
    <Button
      variant="ghost"
      className="flex items-center justify-start gap-3 py-6"
      title="Messages"
      asChild
    >
      <Link href="/messages">
        <div className="relative">
          <ChatBubbleIcon className="h-5 w-5" />
          {query.data?.unreadCount > 0 && (
            <span className="absolute -right-3 -top-3 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-medium tabular-nums text-primary-foreground">
              {query.data?.unreadCount}
            </span>
          )}
        </div>
        <span className="hidden lg:inline">Messages</span>
      </Link>
    </Button>
  );
}
