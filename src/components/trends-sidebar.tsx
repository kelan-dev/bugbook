import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Suspense } from "react";
import { Spinner } from "./ui-custom/spinner";
import Link from "next/link";
import UserAvatar from "./user-avatar";
import { unstable_cache } from "next/cache";
import { formatNumber } from "@/lib/utils";
import FollowButton from "./follow-button";
import { selectUserData } from "@/lib/types";
import UserTooltip from "./user-tooltip";

// ################################################################################################

export default function TrendsSidebar() {
  return (
    <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
      <Suspense fallback={<Spinner />}>
        <WhoToFollow />
        <TrendingTopics />
      </Suspense>
    </div>
  );
}

// ################################################################################################

async function WhoToFollow() {
  const auth = await validateRequest();
  if (!auth.user) return null;

  // Get a short list of users that can be followed. This query only returns users that are:
  // 1. Not the current user
  // 2. Not already followed by the current user
  const usersToFollow = await prisma.user.findMany({
    select: selectUserData(auth.user.id),
    where: {
      id: {
        not: auth.user.id,
      },
      followers: {
        none: {
          followerId: auth.user.id,
        },
      },
    },
    take: 5,
  });

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">Who to follow</div>
      {usersToFollow.map((user) => (
        <div key={user.id} className="flex items-center justify-between gap-3">
          <UserTooltip user={user}>
            <Link
              href={`/users/${user.username}`}
              className="flex items-center gap-3"
            >
              <UserAvatar avatarUrl={user.avatarUrl} className="flex-none" />
              <div>
                <p className="line-clamp-1 break-all font-semibold hover:underline">
                  {user.displayName}
                </p>
                <p className="line-clamp-1 break-all text-muted-foreground">
                  @{user.username}
                </p>
              </div>
            </Link>
          </UserTooltip>
          <FollowButton
            userId={user.id}
            initialData={{
              followerCount: user._count.followers,
              isFollowedByUser: user.followers.some(
                (follower) => follower.followerId === auth.user.id,
              ),
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ################################################################################################

async function TrendingTopics() {
  const trendingTopics = await getTrendingTopics();

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">Trending topics</div>
      {trendingTopics.map(({ hashtag, count }) => {
        const title = hashtag.split("#")[1];
        return (
          <Link key={title} href={`/hashtag/${title}`} className="block">
            <p
              className="line-clamp-1 break-all font-semibold hover:underline"
              title={hashtag}
            >
              {hashtag}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatNumber(count)} {count === 1 ? "post" : "posts"}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

// ################################################################################################

// Calculate and return the top 5 most used hashtags.
// `unstable_cache` is used to cache on the server the results of an operation across
// multiple HTTP requests and users. This is useful here because 1) fetching the trending
// topics is an expensive operation and 2) the data is the same for every user.
// NOTE: This only works in production; in development, this function is not cached.
const getTrendingTopics = unstable_cache(
  async () => {
    const result = await prisma.$queryRaw<{ hashtag: string; count: bigint }[]>`
      SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) AS count 
      FROM posts 
      GROUP BY (hashtag) 
      ORDER BY count DESC, hashtag ASC 
      LIMIT 5
    `;

    return result.map((row) => ({
      hashtag: row.hashtag,
      count: Number(row.count),
    }));
  },
  // The cache key is an array of strings that uniquely identifies the cache entry
  ["trending_topics"],
  // The cache entry will be invalidated after 1 hour
  { revalidate: 1 * 60 * 60 },
);
