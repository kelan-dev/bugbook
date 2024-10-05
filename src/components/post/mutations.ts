import { PostFeedResult } from "@/lib/types";
import { useToast } from "../ui/use-toast";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { deletePost } from "./actions";

// ################################################################################################

export function useDeletePostMutation() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const queryFilter: QueryFilters = { queryKey: ["post-feed"] };

  // Mutation to delete a post
  const mutation = useMutation({
    mutationFn: deletePost,
    onSuccess: async (deletedPost) => {
      // Cancel any running queries that match the query filter to prevent race conditions
      await queryClient.cancelQueries(queryFilter);

      // Update the post feed cache by removing the post
      queryClient.setQueriesData<InfiniteData<PostFeedResult, string | null>>(
        queryFilter,
        (data) => {
          if (!data) return;
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              records: page.records.filter(
                (post) => post.id !== deletedPost.id,
              ),
            })),
          };
        },
      );

      toast({
        description: "Post deleted",
      });

      // If the post was deleted from its details page, then redirect to the user's profile
      if (pathname.includes(deletedPost.id)) {
        router.push(`/users/${deletedPost.user.username}`);
      }
    },
    onError: (error) => {
      console.error(error);
      toast({
        description: "Failed to delete post",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Invalidate the query to ensure data consistency
      queryClient.invalidateQueries(queryFilter);
    },
  });

  return mutation;
}
