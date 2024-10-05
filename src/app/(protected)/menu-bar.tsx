import { Button } from "@/components/ui/button";
import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BookmarkIcon, ChatBubbleIcon, HomeIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import NotificationsButton from "./notifications-button";
import MessagesButton from "./messages-button";
import streamServerClient from "@/lib/stream";

// ################################################################################################

interface MenuBarProps {
  className?: string;
}

export default async function MenuBar({ className }: MenuBarProps) {
  const auth = await validateRequest();
  if (!auth.user) return null;

  // We can get the unread counts server-side and use them as the initial data
  const [unreadNotificationsCount, unreadMessagesCount] = await Promise.all([
    await prisma.notification.count({
      where: {
        recipientId: auth.user.id,
        read: false,
      },
    }),
    (await streamServerClient.getUnreadCount(auth.user.id)).total_unread_count,
  ]);

  return (
    <div className={className}>
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3 py-6"
        title="Home"
        asChild
      >
        <Link href="/">
          <HomeIcon className="h-5 w-5" />
          <span className="hidden lg:inline">Home</span>
        </Link>
      </Button>

      <NotificationsButton
        initialData={{ unreadCount: unreadNotificationsCount }}
      />

      <MessagesButton initialData={{ unreadCount: unreadMessagesCount }} />

      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3 py-6"
        title="Bookmarks"
        asChild
      >
        <Link href="/bookmarks">
          <BookmarkIcon className="h-5 w-5" />
          <span className="hidden lg:inline">Bookmarks</span>
        </Link>
      </Button>
    </div>
  );
}
