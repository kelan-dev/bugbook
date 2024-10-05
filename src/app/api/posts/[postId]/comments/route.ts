import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CommentFeedResult, includeCommentData } from "@/lib/types";
import { NextRequest } from "next/server";

// ################################################################################################

/**
 * Get a page of comments for a specific post.
 *
 * Note that in this case we are fetching the comments in ascending order (oldest to newest) and
 * then taking a negative pageSize, essentially starting from the end of the results (or from the
 * cursor) and working our way backwards. This way, on the client side, all we need to do is
 * reverse the order of the pages in order to display our comments in the correct order, with the
 * newest comments at the bottom of the feed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } },
) {
  try {
    // Ensure the user is authenticated
    const auth = await validateRequest();
    if (!auth.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 5;

    // Fetch the comments from the database
    const comments = await prisma.comment.findMany({
      where: {
        postId: params.postId,
      },
      orderBy: { createdAt: "asc" },
      include: includeCommentData(auth.user.id),
      cursor: cursor ? { id: cursor } : undefined,
      take: -pageSize - 1,
    });

    // Format the response data
    const data: CommentFeedResult = {
      records: comments.length > pageSize ? comments.slice(1) : comments,
      nextCursor: comments.length > pageSize ? comments[0].id : null,
    };

    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
