"use server";

import { validateRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { selectUserData } from "@/lib/types";
import {
  updateUserProfileSchema,
  UpdateUserProfileValues,
} from "@/lib/validation";

// ################################################################################################

export async function updateUserProfile(values: UpdateUserProfileValues) {
  // Validate the data with Zod
  const newProfileData = updateUserProfileSchema.parse(values);

  // Ensure the user is authenticated
  const auth = await validateRequest();
  if (!auth.user) throw new Error("Unauthorized");

  const txResult = await prisma.$transaction(async (tx) => {
    // Update the user's profile in the database
    const updatedUser = await tx.user.update({
      data: newProfileData,
      where: { id: auth.user.id },
      select: selectUserData(auth.user.id),
    });

    // Update the user's profile in the StreamChat database
    await streamServerClient.partialUpdateUser({
      id: auth.user.id,
      set: {
        name: newProfileData.displayName,
      },
    });

    return { updatedUser };
  });

  return txResult.updatedUser;
}
