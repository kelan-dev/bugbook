import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { includePostData, PostFeedResult } from "@/lib/types";
import { NextRequest } from "next/server";

// ################################################################################################

/**
 * Get a page of posts that the authenticated user has bookmarked.
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure the user is authenticated
    const auth = await validateRequest();
    if (!auth.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    // Get the posts from the database
    // Note that we're retrieving the posts via the bookmarks table because we want to order
    // the posts based on when the user bookmarked them, rather than when the posts were created.
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: auth.user.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          include: includePostData(auth.user.id),
        },
      },
      cursor: cursor ? { id: cursor } : undefined,
      take: pageSize + 1,
    });

    // Format the response data
    const data: PostFeedResult = {
      records: bookmarks.slice(0, pageSize).map((bookmark) => bookmark.post),
      nextCursor: bookmarks.length > pageSize ? bookmarks[pageSize].id : null,
    };

    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
