import { useToast } from "@/components/ui/use-toast";
import { deleteComment, submitComment } from "./actions";
import {
  useMutation,
  useQueryClient,
  QueryKey,
  InfiniteData,
} from "@tanstack/react-query";
import { CommentFeedResult, PostFeedResult } from "@/lib/types";

// ################################################################################################

export function useSubmitCommentMutation(postId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey: QueryKey = ["comment-feed", postId];

  // Mutation to submit a comment
  const mutation = useMutation({
    mutationFn: submitComment,
    onSuccess: async (newComment) => {
      // Cancel any running queries that match the query key to prevent race conditions
      await queryClient.cancelQueries({ queryKey });

      // Update the comment feed cache with the new comment
      queryClient.setQueryData<InfiniteData<CommentFeedResult, string | null>>(
        queryKey,
        (data) => {
          const firstPage = data?.pages[0];
          if (!firstPage) return;

          return {
            pageParams: data.pageParams,
            pages: [
              {
                nextCursor: firstPage.nextCursor,
                records: [...firstPage.records, newComment],
              },
              ...data.pages.slice(1),
            ],
          };
        },
      );

      // Update all post feeds to increment the comment count
      queryClient.setQueriesData<InfiniteData<PostFeedResult, string | null>>(
        { queryKey: ["post-feed"] },
        (data) => {
          if (!data) return data;
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              records: page.records.map((post) => {
                if (post.id === postId) {
                  return {
                    ...post,
                    _count: {
                      ...post._count,
                      comments: post._count.comments + 1,
                    },
                  };
                }
                return post;
              }),
            })),
          };
        },
      );

      toast({
        description: "Your comment has been created!",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        description: "An error occurred while submitting your comment.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Invalidate the query to ensure data consistency
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return mutation;
}

// ################################################################################################

export function useDeleteCommentMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation to delete a comment
  const mutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: async (deletedComment) => {
      const queryKey: QueryKey = ["comment-feed", deletedComment.postId];

      // Cancel any running queries that match the query key to prevent race conditions
      await queryClient.cancelQueries({ queryKey });

      // Update the comment feed cache to remove the deleted comment
      queryClient.setQueryData<InfiniteData<CommentFeedResult, string | null>>(
        queryKey,
        (data) => {
          if (!data) return;

          return {
            pageParams: data.pageParams,
            pages: data.pages.map((page) => ({
              nextCursor: page.nextCursor,
              records: page.records.filter((c) => c.id !== deletedComment.id),
            })),
          };
        },
      );

      // Update all post feeds to decrement the comment count
      queryClient.setQueriesData<InfiniteData<PostFeedResult, string | null>>(
        { queryKey: ["post-feed"] },
        (data) => {
          if (!data) return data;
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              records: page.records.map((post) => {
                if (post.id === deletedComment.postId) {
                  return {
                    ...post,
                    _count: {
                      ...post._count,
                      comments: Math.max(0, post._count.comments - 1),
                    },
                  };
                }
                return post;
              }),
            })),
          };
        },
      );

      toast({
        description: "Your comment has been deleted!",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        description: "An error occurred while deleting your comment.",
        variant: "destructive",
      });
    },
    onSettled: (data, error, variables, context) => {
      // Invalidate the query to ensure data consistency
      data?.postId &&
        queryClient.invalidateQueries({
          queryKey: ["comment-feed", data.postId],
        });
    },
  });

  return mutation;
}
