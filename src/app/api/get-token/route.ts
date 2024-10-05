import { validateRequest } from "@/lib/auth";
import streamServerClient from "@/lib/stream";

// ################################################################################################

/**
 * This API route generates a StreamChat authentication token for the user.
 * The token is used to authenticate the user in the StreamChat client.
 */
export async function GET() {
  try {
    // Ensure the user is authenticated
    const auth = await validateRequest();
    if (!auth.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a StreamChat authentication token for the user
    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60;
    const issuedAt = Math.floor(Date.now() / 1000) - 60;
    const token = streamServerClient.createToken(
      auth.user.id,
      expirationTime,
      issuedAt,
    );

    return Response.json({ token }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
