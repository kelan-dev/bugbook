"use client";

import { useAuth } from "@/app/(protected)/auth-provider";
import { FollowerData, UserData } from "@/lib/types";
import Link from "next/link";
import { PropsWithChildren } from "react";
import UserAvatar from "./user-avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import FollowButton from "./follow-button";
import Linkify from "./linkify";
import FollowerCount from "./follower-count";

// ################################################################################################

interface UserTooltipProps extends PropsWithChildren {
  user: UserData;
}

export default function UserTooltip({ children, user }: UserTooltipProps) {
  const auth = useAuth();

  const followerData: FollowerData = {
    followerCount: user._count.followers,
    isFollowedByUser: user.followers.some(
      (follower) => follower.followerId === auth.user?.id,
    ),
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>
          <div className="flex max-w-80 flex-col gap-3 break-words px-1 py-2.5 md:min-w-52">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/users/${user.username}`}>
                <UserAvatar size={70} avatarUrl={user.avatarUrl} />
              </Link>
              {user.id !== auth.user.id && (
                <FollowButton userId={user.id} initialData={followerData} />
              )}
            </div>
            <div>
              <Link href={`/users/${user.username}`}>
                <div className="text-lg font-semibold hover:underline">
                  {user.displayName}
                </div>
                <div className="text-muted-foreground">@{user.username}</div>
              </Link>
            </div>
            {user.bio && (
              <Linkify>
                <div className="line-clamp-4 whitespace-pre-line">
                  {user.bio}
                </div>
              </Linkify>
            )}
            <FollowerCount userId={user.id} initialData={followerData} />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
