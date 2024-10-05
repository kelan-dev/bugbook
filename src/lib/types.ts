import { Prisma } from "@prisma/client";

// ################################################################################################
// Generic types for infinite queries

export type PageInfo = {
  nextCursor: string | null;
};

export type InfiniteQueryResult<T> = PageInfo & {
  records: T[];
};

// ################################################################################################
// User-related types and functions

// Describe the user data we want to access when we fetch a post from the database
export function selectUserData(authUserId: string) {
  return {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    bio: true,
    createdAt: true,
    followers: {
      where: {
        followerId: authUserId,
      },
      select: {
        followerId: true,
      },
    },
    _count: {
      select: {
        posts: true,
        followers: true,
      },
    },
  } satisfies Prisma.UserSelect;
}

// Create a type which represents a user that is fetched from the database
export type UserData = Prisma.UserGetPayload<{
  select: ReturnType<typeof selectUserData>;
}>;

// ################################################################################################
// Post-related types and functions

// `Include` is essentially Prisma's way of defining a `join` query operation
export function includePostData(authUserId: string) {
  return {
    user: {
      select: selectUserData(authUserId),
    },
    attachments: true,
    likes: {
      where: {
        userId: authUserId,
      },
      select: {
        userId: true,
      },
    },
    bookmarks: {
      where: {
        userId: authUserId,
      },
      select: {
        userId: true,
      },
    },
    _count: {
      select: {
        likes: true,
        comments: true,
      },
    },
  } satisfies Prisma.PostInclude;
}

// Create a type which represents a post joined with the data of the associated user
export type PostData = Prisma.PostGetPayload<{
  include: ReturnType<typeof includePostData>;
}>;

// Used to define the shape of the data returned from the post feed query
export type PostFeedResult = InfiniteQueryResult<PostData>;

export type LikeData = {
  likesCount: number;
  isLikedByUser: boolean;
};

export type BookmarkData = {
  isBookmarkedByUser: boolean;
};

// ################################################################################################
// Comment-related types and functions

// For each comment, we want to fetch the associated user data
export function includeCommentData(authUserId: string) {
  return {
    user: {
      select: selectUserData(authUserId),
    },
  } satisfies Prisma.CommentInclude;
}

// Create a type which represents a comment joined with the data of the associated user
export type CommentData = Prisma.CommentGetPayload<{
  include: ReturnType<typeof includeCommentData>;
}>;

// Used to define the shape of the data returned from the comment feed query
export type CommentFeedResult = InfiniteQueryResult<CommentData>;

// ################################################################################################
// Notification-related types and functions

// For each notification, we want to fetch the issuer's data
export const includeNotifications = {
  issuer: {
    select: {
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  post: {
    select: {
      content: true,
    },
  },
} satisfies Prisma.NotificationInclude;

export type NotificationData = Prisma.NotificationGetPayload<{
  include: typeof includeNotifications;
}>;

export type NotificationFeedResult = InfiniteQueryResult<NotificationData>;

export type NotificationCountData = {
  unreadCount: number;
};

// ################################################################################################
// Other utility types

export type FollowerData = {
  followerCount: number;
  isFollowedByUser: boolean;
};

export type MessageCountData = {
  unreadCount: number;
};
