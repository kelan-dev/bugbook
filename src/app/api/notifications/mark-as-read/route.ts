import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requiredString } from "@/lib/validation";

// ################################################################################################

/**
 * Mark a notification as read.
 */
export async function PATCH(request: Request) {
  try {
    // Ensure the user is authenticated
    const auth = await validateRequest();
    if (!auth.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body to check for a notification ID
    const { notificationId } = await request.json().catch(() => ({}));
    if (notificationId) requiredString.cuid().parse(notificationId);

    // TODO: This should probably be redesigned to be a DELETE route; I don't see any reason that
    // we should keep read notifications in our database any longer than we need to.
    if (notificationId) {
      // Mark a single notification as read
      await prisma.notification.update({
        where: {
          id: notificationId,
          recipientId: auth.user.id,
          read: false,
        },
        data: { read: true },
      });
    } else {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          recipientId: auth.user.id,
          read: false,
        },
        data: { read: true },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
