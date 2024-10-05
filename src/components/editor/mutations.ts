import { useToast } from "@/components/ui/use-toast";
import { submitPost } from "./actions";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { PostFeedResult } from "@/lib/types";
import { useAuth } from "@/app/(protected)/auth-provider";

// ################################################################################################

export function useSubmitPostMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Define a filter to identify which queries in the cache to update
  const queryFilter: QueryFilters = {
    queryKey: ["post-feed"],
    predicate(query) {
      return (
        query.queryKey.includes("for-you") ||
        (query.queryKey.includes("user-feed") &&
          query.queryKey.includes(auth?.user?.id))
      );
    },
  };

  // Mutation to submit a post
  const mutation = useMutation({
    mutationFn: submitPost,
    onSuccess: async (newPost) => {
      // Cancel any running queries that match the query filter to prevent race conditions
      await queryClient.cancelQueries(queryFilter);

      // Update the post feed caches with the new post
      queryClient.setQueriesData<InfiniteData<PostFeedResult, string | null>>(
        queryFilter,
        (data) => {
          const firstPage = data?.pages[0];
          if (!firstPage) return;

          return {
            ...data,
            pages: [
              {
                records: [newPost, ...firstPage.records],
                nextCursor: firstPage.nextCursor,
              },
              ...data.pages.slice(1),
            ],
          };
        },
      );

      toast({
        description: "Your post has been created!",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        description: "An error occurred while submitting your post.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Invalidate the queries to ensure data consistency
      queryClient.invalidateQueries(queryFilter);
    },
  });

  return mutation;
}
