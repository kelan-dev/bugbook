import { validateRequest } from "@/lib/auth";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { includeNotifications, NotificationFeedResult } from "@/lib/types";

// ################################################################################################

/**
 * Get a page of notifications for the authenticated user.
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

    // Get the notifications from the database
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: auth.user.id,
        read: false,
      },
      orderBy: { createdAt: "desc" },
      include: includeNotifications,
      cursor: cursor ? { id: cursor } : undefined,
      take: pageSize + 1,
    });

    // Format the response data
    const data: NotificationFeedResult = {
      records:
        notifications.length > pageSize
          ? notifications.slice(1)
          : notifications,
      nextCursor: notifications.length > pageSize ? notifications[0].id : null,
    };

    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
