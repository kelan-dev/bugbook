import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { FollowerData } from "@/lib/types";

// ################################################################################################

/**
 * Get the follower data for a specific user.
 */
export async function GET(
  request: Request,
  { params }: { params: { userid: string } },
) {
  try {
    // Ensure the user is authenticated
    const auth = await validateRequest();
    if (!auth.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the follower data for the specified user
    const user = await prisma.user.findUnique({
      select: {
        followers: {
          select: {
            followerId: true,
          },
          where: {
            followerId: auth.user.id,
          },
        },
        _count: {
          select: {
            followers: true,
          },
        },
      },
      where: {
        id: params.userid,
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const data: FollowerData = {
      followerCount: user._count.followers,
      isFollowedByUser: !!user.followers.length,
    };

    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ################################################################################################

/**
 * Create a follow record for a specific user.
 */
export async function POST(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    // Ensure the user is authenticated
    const auth = await validateRequest();
    if (!auth.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use a transaction to ensure all operations succeed or fail together
    const txResult = await prisma.$transaction(async (tx) => {
      // Create the follow record in the database
      const follow = await tx.follow.upsert({
        update: {},
        create: {
          followerId: auth.user.id,
          followedId: params.userId,
        },
        where: {
          followerId_followedId: {
            followerId: auth.user.id,
            followedId: params.userId,
          },
        },
      });

      // Create a notification for the follow event
      const notification = await tx.notification.create({
        data: {
          issuerId: auth.user.id,
          recipientId: params.userId,
          type: "FOLLOW",
        },
      });

      return { follow, notification };
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ################################################################################################

/**
 * Delete a follow record for a specific user.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { userid: string } },
) {
  try {
    // Ensure the user is authenticated
    const auth = await validateRequest();
    if (!auth.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete the record if it exists
      await tx.follow.deleteMany({
        where: {
          followerId: auth.user.id,
          followedId: params.userid,
        },
      });

      // Delete the notification for the follow event
      await tx.notification.deleteMany({
        where: {
          issuerId: auth.user.id,
          recipientId: params.userid,
          type: "FOLLOW",
        },
      });
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
