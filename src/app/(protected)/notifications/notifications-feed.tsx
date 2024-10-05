"use client";

import { Spinner } from "@/components/ui-custom/spinner";
import InfiniteScrollContainer from "@/components/infinite-scroll-container";
import PostsLoadingSkeleton from "@/components/post/posts-loading-skeleton";
import ky from "@/lib/ky";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import Notification from "./notification";
import { Button } from "@/components/ui/button";
import { NotificationFeedResult } from "@/lib/types";
import { useMarkAllAsReadMutation } from "./use-mark-all-as-read-mutation";
import { useMarkSingleAsReadMutation } from "./use-mark-single-as-read-mutation";

// ################################################################################################

export default function NotificationsFeed() {
  const queryClient = useQueryClient();

  // Query to fetch the user's notifications
  const query = useInfiniteQuery({
    queryKey: ["notifications-feed"],
    queryFn: ({ pageParam }) =>
      ky
        .get(
          "/api/notifications",
          pageParam ? { searchParams: { cursor: pageParam } } : {},
        )
        .json<NotificationFeedResult>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // Mutation to mark all notifications as read
  const { mutate: markAllAsRead } = useMarkAllAsReadMutation();

  // Mutation to mark a single notification as read
  const { mutate: markSingleAsRead } = useMarkSingleAsReadMutation();

  // Flatten the pages into a single array of notifications
  const notifications = query.data?.pages.flatMap((page) => page.records) || [];

  // In the case of the initial loading state
  if (query.isLoading) {
    return <PostsLoadingSkeleton />;
  }

  // In the case of no notifications
  if (query.isSuccess && notifications.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        You&apos;re all caught up on notifications!
      </p>
    );
  }

  // In the case of an error
  if (query.isError) {
    return (
      <p className="text-center text-destructive">
        An error occurred while loading notifications.
      </p>
    );
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button variant="link" size="sm" onClick={() => markAllAsRead()}>
          Clear all notifications
        </Button>
      </div>
      <InfiniteScrollContainer
        className="space-y-5"
        onBottomReached={() =>
          query.hasNextPage && !query.isFetching && query.fetchNextPage()
        }
      >
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
            onDelete={() => markSingleAsRead(notification.id)}
          />
        ))}
        {query.isFetchingNextPage && <Spinner className="mx-auto my-3" />}
      </InfiniteScrollContainer>
    </div>
  );
}
