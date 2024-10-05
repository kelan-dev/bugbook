"use client";

import { Spinner } from "@/components/ui-custom/spinner";
import InfiniteScrollContainer from "@/components/infinite-scroll-container";
import Post from "@/components/post/post";
import PostsLoadingSkeleton from "@/components/post/posts-loading-skeleton";
import ky from "@/lib/ky";
import { PostFeedResult } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";

// ################################################################################################

interface SearchResultsFeedProps {
  searchQuery: string;
}

export default function SearchResultsFeed({
  searchQuery,
}: SearchResultsFeedProps) {
  // Query to fetch the posts for the search results feed
  const query = useInfiniteQuery({
    queryKey: ["post-feed", "search", searchQuery],
    queryFn: ({ pageParam }) =>
      ky
        .get("/api/search", {
          searchParams: {
            query: searchQuery,
            ...(pageParam ? { cursor: pageParam } : {}),
          },
        })
        .json<PostFeedResult>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    gcTime: 0,
  });

  // Flatten the pages into a single array of posts
  const posts = query.data?.pages.flatMap((page) => page.records) || [];

  // In the case of the initial loading state
  if (query.isLoading) {
    return <PostsLoadingSkeleton />;
  }

  // In the case of no posts
  if (query.isSuccess && posts.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Sorry, we couldn&apos;t find any search results.
      </p>
    );
  }

  // In the case of an error
  if (query.isError) {
    return (
      <p className="text-center text-destructive">
        An error occurred while loading posts.
      </p>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() =>
        query.hasNextPage && !query.isFetching && query.fetchNextPage()
      }
    >
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {query.isFetchingNextPage && <Spinner className="mx-auto my-3" />}
    </InfiniteScrollContainer>
  );
}
