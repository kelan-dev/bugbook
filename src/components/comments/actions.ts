"use server";

import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { includeCommentData, PostData } from "@/lib/types";
import { requiredString } from "@/lib/validation";
import { z } from "zod";

// ################################################################################################

const contentSchema = requiredString;
const postSchema = z.object({ id: requiredString, userId: requiredString });

export async function submitComment({
  content,
  post,
}: {
  content: string;
  post: PostData;
}) {
  // Validate the data with Zod
  contentSchema.parse(content);
  postSchema.parse(post);

  // Ensure the user is authenticated
  const auth = await validateRequest();
  if (!auth.user) throw new Error("Unauthorized");

  // Use a transaction to ensure all operations succeed or fail together
  const txResult = await prisma.$transaction(async (tx) => {
    // Create the comment record in the database
    const comment = await tx.comment.create({
      data: {
        postId: post.id,
        userId: auth.user.id,
        content,
      },
      include: includeCommentData(auth.user.id),
    });

    // Create a notification for the comment event
    const notification =
      post.userId !== auth.user.id
        ? await tx.notification.create({
            data: {
              issuerId: auth.user.id,
              recipientId: post.userId,
              postId: post.id,
              type: "COMMENT",
            },
          })
        : null;

    return { comment, notification };
  });

  return txResult.comment;
}

// ################################################################################################

export async function deleteComment(id: string) {
  // Validate the data with Zod
  requiredString.cuid().parse(id);

  // Ensure the user is authenticated
  const auth = await validateRequest();
  if (!auth.user) throw new Error("Unauthorized");

  // Find the comment and ensure the user is authorized to delete it
  const comment = await prisma.comment.findUnique({
    where: { id },
  });
  if (!comment) throw new Error("Comment not found");
  if (comment.userId !== auth.user.id) throw new Error("Unauthorized");

  // Delete the comment
  const deletedComment = await prisma.comment.delete({
    where: { id },
    include: includeCommentData(auth.user.id),
  });

  return deletedComment;
}
