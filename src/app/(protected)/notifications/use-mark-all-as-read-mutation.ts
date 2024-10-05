import { useMutation } from "@tanstack/react-query";
import { InfiniteData } from "@tanstack/react-query";
import { NotificationFeedResult } from "@/lib/types";
import ky from "@/lib/ky";
import { useQueryClient } from "@tanstack/react-query";

// ################################################################################################

const queryKeys = {
  notificationsFeed: ["notifications-feed"],
  unreadCount: ["unread-notifications-count"],
};

export function useMarkAllAsReadMutation() {
  const queryClient = useQueryClient();

  // Mutation to mark all notifications as read
  const mutation = useMutation({
    mutationFn: () => ky.patch("/api/notifications/mark-as-read"),
    onMutate: async () => {
      // Cancel any running queries that match the query key to prevent race conditions
      await queryClient.cancelQueries({ queryKey: Object.values(queryKeys) });

      // Snapshots of the previous data
      const notificationsData = queryClient.getQueryData<
        InfiniteData<NotificationFeedResult, string | null>
      >(queryKeys.notificationsFeed);
      const unreadCountData = queryClient.getQueryData<{
        unreadCount: number;
      }>(queryKeys.unreadCount);

      // Update the notifications feed
      queryClient.setQueryData<
        InfiniteData<NotificationFeedResult, string | null>
      >(queryKeys.notificationsFeed, (data) => ({
        pageParams: [],
        pages: [{ records: [], nextCursor: null }],
      }));

      // Update the unread notifications count
      queryClient.setQueryData(queryKeys.unreadCount, {
        unreadCount: 0,
      });

      // Return the previous data to be restored in case of an error
      return { notificationsData, unreadCountData };
    },
    onError: (error, _, context) => {
      console.error("Error marking notifications as read", error);

      // Restore the previous data
      context?.notificationsData &&
        queryClient.setQueryData(
          queryKeys.notificationsFeed,
          context?.notificationsData,
        );
      context?.unreadCountData &&
        queryClient.setQueryData(
          queryKeys.unreadCount,
          context?.unreadCountData,
        );
    },
    onSettled: () => {
      // Invalidate the queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: Object.values(queryKeys) });
    },
  });

  return mutation;
}
