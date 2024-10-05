"use client";

import Link from "next/link";
import UserAvatar from "@/components/user-avatar";
import { cn, formatDateRelative } from "@/lib/utils";
import { PostData } from "@/lib/types";
import { useAuth } from "@/app/(protected)/auth-provider";
import PostMoreButton from "./post-more-button";
import Linkify from "../linkify";
import UserTooltip from "../user-tooltip";
import { Media } from "@prisma/client";
import Image from "next/image";
import LikeButton from "./like-button";
import BookmarkButton from "./bookmark-button";
import { useState } from "react";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
import CommentFeed from "../comments/comment-feed";
import CommentInput from "../comments/comment-input";

// ################################################################################################

interface PostProps {
  post: PostData;
}

export default function Post({ post }: PostProps) {
  const auth = useAuth();
  const [showComments, setShowComments] = useState(false);

  return (
    <article className="group/post space-y-3 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <UserTooltip user={post.user}>
            <Link href={`/users/${post.user.username}`}>
              <UserAvatar avatarUrl={post.user.avatarUrl} />
            </Link>
          </UserTooltip>
          <div>
            <UserTooltip user={post.user}>
              <Link
                href={`/users/${post.user.username}`}
                className="block font-medium hover:underline"
              >
                {post.user.displayName}
              </Link>
            </UserTooltip>
            {/* The `formatDateRelative` function can produce a hydration error when the
            time returned is still displayed in seconds, so we suppress it here. */}
            <Link
              href={`/posts/${post.id}`}
              className="block text-sm text-muted-foreground hover:underline"
              suppressHydrationWarning
            >
              {formatDateRelative(post.createdAt)}
            </Link>
          </div>
        </div>
        {post.user.id === auth.user?.id && (
          <PostMoreButton
            post={post}
            className="opacity-0 transition-opacity group-hover/post:opacity-100"
          />
        )}
      </div>
      <Linkify>
        <div className="whitespace-pre-line break-words">{post.content}</div>
      </Linkify>
      {post.attachments.length > 0 && (
        <MediaPreviews medias={post.attachments} />
      )}
      <hr className="border-muted-foreground/20" />
      <div className="flex justify-between gap-5">
        <div className="flex items-center gap-5">
          <LikeButton
            postId={post.id}
            initialData={{
              likesCount: post._count.likes,
              isLikedByUser: post.likes.some(
                (like) => like.userId === auth.user?.id,
              ),
            }}
          />
          <CommentButton
            post={post}
            onClick={() => setShowComments((s) => !s)}
          />
        </div>
        <BookmarkButton
          postId={post.id}
          initialData={{
            isBookmarkedByUser: post.bookmarks.some(
              (bookmark) => bookmark.userId === auth.user?.id,
            ),
          }}
        />
      </div>
      {showComments && (
        <>
          <CommentFeed post={post} />
          <CommentInput post={post} />
        </>
      )}
    </article>
  );
}

// ################################################################################################

interface MediaPreviewsProps {
  medias: Media[];
}

function MediaPreviews({ medias }: MediaPreviewsProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        medias.length > 1 && "sm:grid sm:grid-cols-2",
      )}
    >
      {medias.map((attachment) => (
        <MediaPreview key={attachment.id} media={attachment} />
      ))}
    </div>
  );
}

// ################################################################################################

interface MediaPreviewProps {
  media: Media;
}

function MediaPreview({ media }: MediaPreviewProps) {
  if (media.type === "IMAGE") {
    return (
      <Image
        src={media.url}
        alt="Attachment"
        width={500}
        height={500}
        className="mx-auto size-fit max-h-[30rem] rounded-2xl"
      />
    );
  }

  // Wrapping the video in a div helps resolve compatibility issues with browser extensions
  if (media.type === "VIDEO") {
    return (
      <div>
        <video
          controls
          src={media.url}
          className="mx-auto size-fit max-h-[30rem] rounded-2xl"
        />
      </div>
    );
  }

  return <p className="text-destructive">Unsupported media type</p>;
}

// ################################################################################################

interface CommentButtonProps {
  post: PostData;
  onClick: () => void;
}

function CommentButton({ post, onClick }: CommentButtonProps) {
  return (
    <button onClick={onClick} className="flex items-center gap-2">
      <ChatBubbleIcon />
      <span className="text-sm font-medium tabular-nums">
        {post._count.comments}{" "}
        <span className="hidden sm:inline">
          {post._count.comments === 1 ? "comment" : "comments"}
        </span>
      </span>
    </button>
  );
}
