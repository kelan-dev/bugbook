"use server";

import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { includePostData } from "@/lib/types";
import { deletePostSchema, DeletePostValues } from "@/lib/validation";

// ################################################################################################

export async function deletePost(values: DeletePostValues) {
  // Validate the data with Zod
  const id = deletePostSchema.parse(values);

  // Ensure the user is authenticated
  const auth = await validateRequest();
  if (!auth.user) throw new Error("Unauthorized");

  // Try to get the post from the database
  const post = await prisma.post.findUnique({
    where: { id },
    include: includePostData(auth.user.id),
  });

  // Ensure the post exists and belongs to the user
  if (!post) throw new Error("Post not found");
  if (post.userId !== auth.user.id) throw new Error("Unauthorized");

  // Delete the post
  const deletedPost = await prisma.post.delete({
    where: { id },
    include: includePostData(auth.user.id),
  });

  return deletedPost;
}
