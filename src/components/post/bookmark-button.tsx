"use client";

import { BookmarkData } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import {
  useQuery,
  useQueryClient,
  useMutation,
  QueryKey,
} from "@tanstack/react-query";
import ky from "@/lib/ky";
import { BookmarkFilledIcon, BookmarkIcon } from "@radix-ui/react-icons";

// ################################################################################################

interface BookmarkButtonProps {
  postId: string;
  initialData: BookmarkData;
}

export default function BookmarkButton({
  postId,
  initialData,
}: BookmarkButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey: QueryKey = ["bookmark-data", postId];

  // Query to get the bookmark data for the post
  const { data } = useQuery({
    queryKey,
    queryFn: () =>
      ky.get(`/api/posts/${postId}/bookmarks`).json<BookmarkData>(),
    staleTime: Infinity,
    initialData,
  });

  // Mutation to toggle the post's bookmark status
  const { mutate } = useMutation({
    onMutate: async () => {
      // Cancel any running queries that match the query key to prevent race conditions
      await queryClient.cancelQueries({ queryKey });

      // Get a snapshot of the current data
      const queryData = queryClient.getQueryData<BookmarkData>(queryKey);

      // Update the bookmark data cache
      queryClient.setQueryData<BookmarkData>(queryKey, (data) => {
        if (!data) return;
        return {
          isBookmarkedByUser: !data.isBookmarkedByUser,
        };
      });

      // Return the previous data so we can revert to it in case of an error
      return { queryData };
    },
    mutationFn: () => {
      const endpoint = `/api/posts/${postId}/bookmarks`;
      // Call the appropriate endpoint based on the current status
      return data.isBookmarkedByUser ? ky.delete(endpoint) : ky.post(endpoint);
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
      {data.isBookmarkedByUser ? (
        <BookmarkFilledIcon className="text-primary" />
      ) : (
        <BookmarkIcon />
      )}
    </button>
  );
}
