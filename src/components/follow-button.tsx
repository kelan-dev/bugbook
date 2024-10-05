"use client";

import { FollowerData } from "@/lib/types";
import { useToast } from "./ui/use-toast";
import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import useFollowerData from "@/hooks/use-follower-data";
import { Button } from "./ui/button";
import ky from "@/lib/ky";

// ################################################################################################

interface FollowButtonProps {
  userId: string;
  initialData: FollowerData;
}

export default function FollowButton({
  userId,
  initialData,
}: FollowButtonProps) {
  const { toast } = useToast();
  const { data } = useFollowerData(userId, initialData);
  const queryClient = useQueryClient();
  const queryKey: QueryKey = ["follower-data", userId];

  // Mutation to toggle the user's follow status
  const { mutate } = useMutation({
    mutationFn: () => {
      const endpoint = `/api/users/${userId}/followers`;
      // Call the appropriate endpoint based on the current status
      return data.isFollowedByUser ? ky.delete(endpoint) : ky.post(endpoint);
    },
    onMutate: async () => {
      // Cancel any running queries that match the query key to prevent race conditions
      await queryClient.cancelQueries({ queryKey });

      // Get a snapshot of the current data
      const queryData = queryClient.getQueryData<FollowerData>(queryKey);

      // Update the follower data cache
      queryClient.setQueryData<FollowerData>(queryKey, (data) => {
        if (!data) return;
        return {
          followerCount:
            (data.followerCount || 0) + (data.isFollowedByUser ? -1 : 1),
          isFollowedByUser: !data.isFollowedByUser,
        };
      });

      // Return the previous data so we can revert to it in case of an error
      return { queryData };
    },
    onError: (error, _variables, context) => {
      // If there's an error, revert the cache to the previous data
      queryClient.setQueryData(queryKey, context?.queryData);
      console.error(error);
      toast({
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Invalidate the query to ensure data consistency
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return (
    <Button
      variant={data.isFollowedByUser ? "secondary" : "default"}
      onClick={() => mutate()}
    >
      {data.isFollowedByUser ? "Unfollow" : "Follow"}
    </Button>
  );
}
