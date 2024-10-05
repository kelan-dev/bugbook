"use client";

import { LikeData } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import {
  useQuery,
  useQueryClient,
  useMutation,
  QueryKey,
} from "@tanstack/react-query";
import ky from "@/lib/ky";
import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";

// ################################################################################################

interface LikeButtonProps {
  postId: string;
  initialData: LikeData;
}

export default function LikeButton({ postId, initialData }: LikeButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey: QueryKey = ["like-data", postId];

  // Query to get the like data for the post
  const { data } = useQuery({
    queryKey,
    queryFn: () => ky.get(`/api/posts/${postId}/likes`).json<LikeData>(),
    staleTime: Infinity,
    initialData,
  });

  // Mutation to toggle the post's like status
  const { mutate } = useMutation({
    onMutate: async () => {
      // Cancel any running queries that match the query key to prevent race conditions
      await queryClient.cancelQueries({ queryKey });

      // Get a snapshot of the current data
      const queryData = queryClient.getQueryData<LikeData>(queryKey);

      // Update the like data cache
      queryClient.setQueryData<LikeData>(queryKey, (data) => {
        if (!data) return;
        return {
          likesCount: (data.likesCount || 0) + (data.isLikedByUser ? -1 : 1),
          isLikedByUser: !data.isLikedByUser,
        };
      });

      // Return the previous data so we can revert to it in case of an error
      return { queryData };
    },
    mutationFn: () => {
      const endpoint = `/api/posts/${postId}/likes`;
      // Call the appropriate endpoint based on the current status
      return data.isLikedByUser ? ky.delete(endpoint) : ky.post(endpoint);
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
    <button onClick={() => mutate()} className="flex items-center gap-2">
      {data.isLikedByUser ? (
        <HeartFilledIcon className="text-red-500" />
      ) : (
        <HeartIcon />
      )}
      <span className="text-sm font-medium tabular-nums">
        {data.likesCount}{" "}
        <span className="hidden sm:inline">
          {data.likesCount === 1 ? "like" : "likes"}
        </span>
      </span>
    </button>
  );
}
