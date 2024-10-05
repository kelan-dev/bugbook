import FollowButton from "@/components/follow-button";
import FollowerCount from "@/components/follower-count";
import TrendsSidebar from "@/components/trends-sidebar";
import UserAvatar from "@/components/user-avatar";
import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { FollowerData, selectUserData, UserData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { formatDate } from "date-fns";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import UserFeed from "./user-feed";
import Linkify from "@/components/linkify";
import EditProfileButton from "./edit-profile-button";

// ################################################################################################

// Cache the function to prevent re-fetching in the same HTTP request
const getUser = cache(async (username: string, authUserId: string) => {
  // Get the user data from the database
  const user = await prisma.user.findFirst({
    select: selectUserData(authUserId),
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
  });

  // Redirect to the 404 page if the user is not found
  if (!user) notFound();

  return user;
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  // Ensure the user is authenticated
  const auth = await validateRequest();
  if (!auth.user) return {};

  // Get the user data from the database
  const user = await getUser(params.username, auth.user.id);

  // Return the metadata for the page
  return {
    title: `${user.displayName} (@${user.username})`,
  };
}

// ################################################################################################

interface PageProps {
  params: {
    username: string;
  };
}

export default async function Page({ params }: PageProps) {
  // Ensure the user is authenticated
  const auth = await validateRequest();
  if (!auth.user) return <p className="text-destructive">Unauthorized</p>;

  // Get the user data from the database
  const user = await getUser(params.username, auth.user.id);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <UserProfile user={user} authUserId={auth.user.id} />
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-center text-2xl font-bold">
            {user.displayName}&apos;s Posts
          </h2>
        </div>
        <UserFeed userId={user.id} />
      </div>
      <TrendsSidebar />
    </main>
  );
}

// ################################################################################################

interface UserProfileProps {
  user: UserData;
  authUserId: string;
}

async function UserProfile({ user, authUserId }: UserProfileProps) {
  // The initial state of the follower data based on the user's followers
  const followerData: FollowerData = {
    followerCount: user._count.followers,
    isFollowedByUser: user.followers.some(
      (follower) => follower.followerId === authUserId,
    ),
  };

  return (
    <div className="h-fit w-full space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <UserAvatar
        avatarUrl={user.avatarUrl}
        size={250}
        className="mx-auto size-full max-h-60 max-w-60 rounded-full"
      />
      <div className="flex flex-wrap gap-3 sm:flex-nowrap">
        <div className="me-auto space-y-3">
          <div>
            <h1 className="text-3xl font-bold">{user.displayName}</h1>
            <div className="text-muted-foreground">@{user.username}</div>
          </div>
          <div>Member since {formatDate(user.createdAt, "MMM d, yyyy")}</div>
          <div className="flex items-center gap-3">
            <span>
              Posts:{" "}
              <span className="font-semibold">
                {formatNumber(user._count.posts)}
              </span>
            </span>
            <FollowerCount userId={user.id} initialData={followerData} />
          </div>
        </div>
        {user.id === authUserId ? (
          <EditProfileButton user={user} />
        ) : (
          <FollowButton userId={user.id} initialData={followerData} />
        )}
      </div>
      {user.bio && (
        <>
          <hr />
          <Linkify>
            <div className="overflow-hidden whitespace-pre-line break-words">
              {user.bio}
            </div>
          </Linkify>
        </>
      )}
    </div>
  );
}
