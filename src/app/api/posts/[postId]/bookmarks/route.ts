import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BookmarkData } from "@/lib/types";

// ################################################################################################

/**
 * Get the bookmark data for a specific post.
 */
export async function GET(
  request: Request,
  { params }: { params: { postId: string } },
) {
  try {
    // Ensure the user is authenticated
    const auth = await validateRequest();
    if (!auth.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the bookmark data for the specified post
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: auth.user.id,
          postId: params.postId,
        },
      },
    });

    // Format the response data
    const data: BookmarkData = {
      isBookmarkedByUser: !!bookmark,
    };

    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ################################################################################################

/**
 * Create a bookmark record for a specific post.
 */
export async function POST(
  request: Request,
  { params }: { params: { postId: string } },
) {
  try {
    // Ensure the user is authenticated
    const auth = await validateRequest();
    if (!auth.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a new bookmark for the specified post
    await prisma.bookmark.upsert({
      update: {},
      create: {
        userId: auth.user.id,
        postId: params.postId,
      },
      where: {
        userId_postId: {
          userId: auth.user.id,
          postId: params.postId,
        },
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ################################################################################################

/**
 * Delete a bookmark record for a specific post.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { postId: string } },
) {
  try {
    // Ensure the user is authenticated
    const auth = await validateRequest();
    if (!auth.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the bookmark for the specified post
    await prisma.bookmark.deleteMany({
      where: {
        userId: auth.user.id,
        postId: params.postId,
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
