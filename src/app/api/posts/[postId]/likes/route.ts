import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { LikeData } from "@/lib/types";

// ################################################################################################

/**
 * Get the like data for a specific post.
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

    // Fetch the like data for the specified post
    const post = await prisma.post.findUnique({
      where: { id: params.postId },
      select: {
        likes: {
          where: {
            userId: auth.user.id,
          },
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Format the response data
    const data: LikeData = {
      likesCount: post._count.likes,
      isLikedByUser: !!post.likes.length,
    };

    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ################################################################################################

/**
 * Create a like record for a specific post.
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

    // Get the post author id
    const post = await prisma.post.findUnique({
      where: { id: params.postId },
      select: { userId: true },
    });
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Use a transaction to ensure all operations succeed or fail together
    const txResult = await prisma.$transaction(async (tx) => {
      // Create the like record in the database
      const like = await tx.like.upsert({
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

      // Create a notification for the like event
      const notification =
        post.userId !== auth.user.id
          ? await tx.notification.create({
              data: {
                issuerId: auth.user.id,
                recipientId: post.userId,
                postId: params.postId,
                type: "LIKE",
              },
            })
          : null;

      return { like, notification };
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ################################################################################################

/**
 * Delete a like record for a specific post.
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

    // Get the post author id
    const post = await prisma.post.findUnique({
      where: { id: params.postId },
      select: { userId: true },
    });
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete the like for the specified post
      await tx.like.deleteMany({
        where: {
          userId: auth.user.id,
          postId: params.postId,
        },
      });

      // Delete the notification for the like event
      await tx.notification.deleteMany({
        where: {
          issuerId: auth.user.id,
          recipientId: post.userId,
          postId: params.postId,
          type: "LIKE",
        },
      });
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
