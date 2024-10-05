import { CommentFeedResult, PostData } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import ky from "@/lib/ky";
import Comment from "./comment";
import { Button } from "../ui/button";
import { Spinner } from "../ui-custom/spinner";

// ################################################################################################

interface CommentFeedProps {
  post: PostData;
}

export default function CommentFeed({ post }: CommentFeedProps) {
  // Query to fetch the comments for a post
  const query = useInfiniteQuery({
    queryKey: ["comment-feed", post.id],
    queryFn: ({ pageParam }) =>
      ky
        .get(
          `/api/posts/${post.id}/comments`,
          pageParam ? { searchParams: { cursor: pageParam } } : {},
        )
        .json<CommentFeedResult>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => ({
      // The query already returns the comments in ascending order (oldest to newest),
      // per page, but we still have to reverse the order of the pages in order to get
      // the final array of comments in the order we want them.
      pages: [...data.pages].reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
  });

  // Flatten the pages into a single array of comments
  const comments = query.data?.pages.flatMap((page) => page.records) || [];

  // In the case of the initial loading state
  if (query.isLoading) {
    return <Spinner className="mx-auto my-3" />;
  }

  // In the case of no comments
  if (query.isSuccess && comments.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No comments yet. Be the first to comment!
      </p>
    );
  }

  // In the case of an error
  if (query.isError) {
    return (
      <p className="text-center text-destructive">
        An error occurred while loading comments.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {query.hasNextPage && (
        <Button
          variant="link"
          className="mx-auto block"
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetching}
        >
          Load previous comments
        </Button>
      )}
      <div className="divide-y">
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
