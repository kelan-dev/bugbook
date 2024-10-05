import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/user-avatar";
import { NotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NotificationType } from "@prisma/client";
import {
  ChatBubbleIcon,
  Cross2Icon,
  HeartIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";

// ################################################################################################

type NotificationTypeMap = Record<
  NotificationType,
  { message: string; icon: JSX.Element; href: string }
>;

const notificationTypeMap: NotificationTypeMap = {
  FOLLOW: {
    message: `followed you`,
    icon: <PersonIcon />,
    href: `/users/{{username}}`,
  },
  COMMENT: {
    message: `commented on your post`,
    icon: <ChatBubbleIcon />,
    href: `/posts/{{postId}}`,
  },
  LIKE: {
    message: `liked your post`,
    icon: <HeartIcon />,
    href: `/posts/{{postId}}`,
  },
};

interface NotificationProps {
  notification: NotificationData;
  onDelete: () => void;
}

export default function Notification({
  notification,
  onDelete,
}: NotificationProps) {
  const { message, icon, href } = notificationTypeMap[notification.type];

  // Replace placeholders in href
  const finalHref = href
    .replace("{{username}}", notification.issuer.username)
    .replace("{{postId}}", notification.postId || "");

  return (
    <Link href={finalHref} className="block">
      <article
        className={cn(
          "relative flex items-center gap-3 rounded-2xl bg-card p-5 shadow-sm transition-colors hover:bg-accent",
          !notification.read && "bg-card/70",
        )}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="mr-3">{icon}</div>
            <UserAvatar avatarUrl={notification.issuer.avatarUrl} size={36} />
            <p>
              <span className="font-bold">
                {notification.issuer.displayName}
              </span>{" "}
              {message}
            </p>
          </div>

          {notification.post && (
            <div className="line-clamp-3 text-ellipsis whitespace-pre-line text-muted-foreground">
              {notification.post.content}
            </div>
          )}
        </div>

        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 hover:bg-primary/80 hover:text-primary-foreground/80"
        >
          <Cross2Icon className="h-4 w-4" />
        </Button>
      </article>
    </Link>
  );
}
