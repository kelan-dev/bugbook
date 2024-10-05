import { validateRequest } from "@/lib/auth";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { includePostData, PostFeedResult } from "@/lib/types";

// ################################################################################################

/**
 * Get a page of posts from users that the authenticated user follows.
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
    const posts = await prisma.post.findMany({
      where: {
        user: {
          followers: {
            some: {
              followerId: auth.user.id,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: includePostData(auth.user.id),
      cursor: cursor ? { id: cursor } : undefined,
      take: pageSize + 1,
    });

    // Format the response data
    const data: PostFeedResult = {
      records: posts.slice(0, pageSize),
      nextCursor: posts.length > pageSize ? posts[pageSize].id : null,
    };

    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
