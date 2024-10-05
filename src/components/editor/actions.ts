"use server";

import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { includePostData } from "@/lib/types";
import { createPostSchema, CreatePostValues } from "@/lib/validation";

// ################################################################################################

export async function submitPost(values: CreatePostValues) {
  // Validate the data with Zod
  const { content, mediaIds } = createPostSchema.parse(values);

  // Ensure the user is authenticated
  const auth = await validateRequest();
  if (!auth.user) throw new Error("Unauthorized");

  // Create the post in the database
  const newPost = await prisma.post.create({
    data: {
      content,
      userId: auth.user.id,
      attachments: {
        connect: mediaIds?.map((id) => ({ id })),
      },
    },
    include: includePostData(auth.user.id),
  });

  return newPost;
}
