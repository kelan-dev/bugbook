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

export function useMarkSingleAsReadMutation() {
  const queryClient = useQueryClient();

  // Mutation to mark a single notification as read
  const mutation = useMutation({
    mutationFn: (notificationId: string) =>
      ky.patch("/api/notifications/mark-as-read", {
        json: { notificationId },
      }),
    onMutate: async (notificationId) => {
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
        pageParams: data?.pageParams || [],
        pages:
          data?.pages.map((page) => ({
            ...page,
            records: page.records.filter((n) => n.id !== notificationId),
          })) || [],
      }));

      // Update the unread notifications count
      queryClient.setQueryData<{ unreadCount: number }>(
        queryKeys.unreadCount,
        (old) => ({
          unreadCount: Math.max((old?.unreadCount || 0) - 1, 0),
        }),
      );

      // Return the previous data to be restored in case of an error
      return { notificationsData, unreadCountData };
    },
    onError: (error, _, context) => {
      console.error("Error marking notification as read", error);

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
