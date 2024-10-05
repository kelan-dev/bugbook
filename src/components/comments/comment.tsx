import { CommentData } from "@/lib/types";
import UserTooltip from "../user-tooltip";
import Link from "next/link";
import UserAvatar from "../user-avatar";
import { formatDateRelative } from "@/lib/utils";
import { useAuth } from "@/app/(protected)/auth-provider";
import { CommentMoreButton } from "./comment-more-button";

// ################################################################################################

interface CommentProps {
  comment: CommentData;
}

export default function Comment({ comment }: CommentProps) {
  const auth = useAuth();

  return (
    <div className="group/comment flex gap-3 py-3">
      <span className="hidden sm:inline">
        <UserTooltip user={comment.user}>
          <Link href={`/users/${comment.user.username}`}>
            <UserAvatar avatarUrl={comment.user.avatarUrl} size={40} />
          </Link>
        </UserTooltip>
      </span>
      <div>
        <div className="flex items-center gap-3 text-sm">
          <UserTooltip user={comment.user}>
            <Link
              href={`/users/${comment.user.username}`}
              className="font-medium hover:underline"
            >
              {comment.user.displayName}
            </Link>
          </UserTooltip>
          <span className="text-muted-foreground" suppressHydrationWarning>
            {formatDateRelative(comment.createdAt)}
          </span>
        </div>
        <div>{comment.content}</div>
      </div>
      {auth.user?.id === comment.user.id && (
        <CommentMoreButton
          comment={comment}
          className="ms-auto opacity-0 transition-opacity group-hover/comment:opacity-100"
        />
      )}
    </div>
  );
}
