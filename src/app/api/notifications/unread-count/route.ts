import prisma from "@/lib/prisma";
import { validateRequest } from "@/lib/auth";
import { NotificationCountData } from "@/lib/types";

// ################################################################################################

/**
 * Get the unread notification count for the authenticated user.
 */
export async function GET(req: Request) {
  try {
    // Ensure the user is authenticated
    const auth = await validateRequest();
    if (!auth.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the unread notification count
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: auth.user.id,
        read: false,
      },
    });

    // Format the response data
    const data: NotificationCountData = {
      unreadCount,
    };

    // Return the unread notification count
    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
