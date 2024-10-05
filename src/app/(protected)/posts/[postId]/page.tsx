import FollowButton from "@/components/follow-button";
import Linkify from "@/components/linkify";
import Post from "@/components/post/post";
import { Spinner } from "@/components/ui-custom/spinner";
import UserAvatar from "@/components/user-avatar";
import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { includePostData, UserData } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

// ################################################################################################

// Cache the function to prevent re-fetching in the same HTTP request
const getPost = cache(async (postId: string, authUserId: string) => {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    include: includePostData(authUserId),
  });

  // Redirect to the 404 page if the post is not found
  if (!post) notFound();

  return post;
});

export async function generateMetadata({ params }: PageProps) {
  // Ensure the user is authenticated
  const auth = await validateRequest();
  if (!auth.user) return {};

  // Get the post data from the database
  const post = await getPost(params.postId, auth.user.id);

  const name = post.user.displayName;
  const content = post.content.slice(0, 50);
  const ellipsis = post.content.length > 50 ? "..." : "";

  // Return the metadata for the page
  return {
    title: `${name}: ${content}${ellipsis}`,
  };
}

// ################################################################################################

interface PageProps {
  params: {
    postId: string;
  };
}

export default async function Page({ params }: PageProps) {
  // Ensure the user is authenticated
  const auth = await validateRequest();
  if (!auth.user) return <p className="text-destructive">Unauthorized</p>;

  // Get the post data from the database
  const post = await getPost(params.postId, auth.user.id);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <Post post={post} />
      </div>
      <div className="sticky top-[5.25rem] hidden h-fit w-80 flex-none md:block">
        <UserInfoSidebar user={post.user} />
      </div>
    </main>
  );
}

// ################################################################################################

interface UserInfoSidebarProps {
  user: UserData;
}

async function UserInfoSidebar({ user }: UserInfoSidebarProps) {
  // Ensure the user is authenticated
  const auth = await validateRequest();
  if (!auth.user) return null;

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">About this user</div>
      <Link
        href={`/users/${user.username}`}
        className="flex items-center gap-2"
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
      <Linkify>
        <div className="line-clamp-6 whitespace-pre-line break-words text-muted-foreground">
          {user.bio}
        </div>
      </Linkify>
      {user.id !== auth.user.id && (
        <FollowButton
          userId={user.id}
          initialData={{
            followerCount: user._count.followers,
            isFollowedByUser: user.followers.some(
              (follower) => follower.followerId === auth.user.id,
            ),
          }}
        />
      )}
    </div>
  );
}
