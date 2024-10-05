import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { selectUserData } from "@/lib/types";

// ################################################################################################

/**
 * Get a user's data based on their username.
 */
export async function GET(
  request: Request,
  { params }: { params: { username: string } },
) {
  try {
    // Ensure the user is authenticated
    const auth = await validateRequest();
    if (!auth.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.user.findFirst({
      select: selectUserData(auth.user.id),
      where: {
        username: {
          equals: params.username,
          mode: "insensitive",
        },
      },
    });

    // If the user is not found, return a 404 error
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Return the user data
    return Response.json(user, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
