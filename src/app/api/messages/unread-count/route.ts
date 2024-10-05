import { validateRequest } from "@/lib/auth";
import { MessageCountData } from "@/lib/types";
import streamServerClient from "@/lib/stream";

// ################################################################################################

/**
 * Get the unread message count for the authenticated user.
 */
export async function GET() {
  try {
    // Ensure the user is authenticated
    const auth = await validateRequest();
    if (!auth.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the unread message count
    const { total_unread_count } = await streamServerClient.getUnreadCount(
      auth.user.id,
    );

    // Format the response data
    const data: MessageCountData = {
      unreadCount: total_unread_count,
    };

    // Return the unread message count
    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
