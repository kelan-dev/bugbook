import prisma from "@/lib/prisma";
import { validateRequest } from "@/lib/auth";
import { createUploadthing, FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { UPLOADTHING_PATH } from "@/lib/constants";
import streamServerClient from "@/lib/stream";

// ################################################################################################

const f = createUploadthing();

// Define the file router for the app, which can contain multiple file routes
export const fileRouter = {
  // A file route for user avatar images
  avatar: f({
    image: { maxFileSize: "512KB" },
  })
    // Middleware to validate the request and get the user; runs on server
    .middleware(async ({ req }) => {
      // Ensure the user is authenticated
      const auth = await validateRequest();
      if (!auth.user) throw new UploadThingError("Unauthorized");

      // Anything returned here is accessible in onUploadComplete as `metadata`
      return { user: auth.user };
    })
    // Callback that runs when the upload is complete; runs on server
    .onUploadComplete(async ({ metadata, file }) => {
      const newAvatarUrl = file.url.replace("/f/", UPLOADTHING_PATH);

      await Promise.all([
        // Update the user's avatar URL in the database
        await prisma.user.update({
          data: { avatarUrl: newAvatarUrl },
          where: { id: metadata.user.id },
        }),

        // Update the user's avatar URL in the StreamChat database
        await streamServerClient.partialUpdateUser({
          id: metadata.user.id,
          set: {
            image: newAvatarUrl,
          },
        }),
      ]);

      // Delete the old avatar from Uploadthing if it exists
      const oldAvatarUrl = metadata.user.avatarUrl;
      if (oldAvatarUrl) {
        const key = oldAvatarUrl.split(UPLOADTHING_PATH)[1];
        await new UTApi().deleteFiles([key]);
      }

      // Anything returned here is accessible on the client in the result's `serverData`
      return { avatarUrl: newAvatarUrl };
    }),
  // A file route for post attachments
  attachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    video: { maxFileSize: "64MB", maxFileCount: 5 },
  })
    // Middleware to validate the request; runs on server
    .middleware(async ({ req }) => {
      // Ensure the user is authenticated
      const auth = await validateRequest();
      if (!auth.user) throw new UploadThingError("Unauthorized");

      // We don't need to return anything here
      return {};
    })
    // Callback that runs when the upload is complete; runs on server
    .onUploadComplete(async ({ metadata, file }) => {
      // Create a new media record in the database; the post ID is added on post creation
      const media = await prisma.media.create({
        data: {
          url: file.url.replace("/f/", UPLOADTHING_PATH),
          type: file.type.startsWith("image") ? "IMAGE" : "VIDEO",
        },
      });

      // Anything returned here is accessible on the client in the result's `serverData`
      return { mediaId: media.id };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;
