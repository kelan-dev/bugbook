import prisma from "@/lib/prisma";
import { UTApi } from "uploadthing/server";
import { UPLOADTHING_PATH } from "@/lib/constants";

// ################################################################################################

/**
 * Clear unused media from the database and Uploadthing.
 */
export async function GET(request: Request) {
  try {
    // Ensure the request is authenticated
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find all media that is not used in any post and is older than 1 day
    const unusedMedia = await prisma.media.findMany({
      where: {
        postId: null,
        ...(process.env.NODE_ENV === "production" && {
          createdAt: {
            lte: new Date(Date.now() - 1000 * 60 * 60 * 24),
          },
        }),
      },
      select: {
        id: true,
        url: true,
      },
    });

    // Delete the media from Uploadthing
    new UTApi().deleteFiles(
      unusedMedia.map((media) => media.url.split(UPLOADTHING_PATH)[1]),
    );

    // Delete the media from the database
    await prisma.media.deleteMany({
      where: {
        id: {
          in: unusedMedia.map((media) => media.id),
        },
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
