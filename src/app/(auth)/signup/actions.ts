"use server";

import prisma from "@/lib/prisma";
import argon2 from "@node-rs/argon2";
import { createSession, lucia } from "@/lib/auth";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { generateIdFromEntropySize } from "lucia";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
import streamServerClient from "@/lib/stream";

// ################################################################################################

export async function signUp(values: SignUpValues): Promise<{ error: string }> {
  try {
    // Validate the data with Zod
    const { username, email, password } = signUpSchema.parse(values);

    // Check if the username is already taken
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if (existingUsername) {
      return { error: "Username already in use" };
    }

    // Check if the email address is already taken
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (existingEmail) {
      return { error: "Email already in use" };
    }

    // Generate a unique ID for the user
    // NOTE: Another valid option would be to allow Prisma to auto-generate a CUID
    const userId = generateIdFromEntropySize(10);

    // Hash the user's password
    const passwordHash = await argon2.hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Create the user in the database
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: username,
          email,
          passwordHash,
        },
      });

      // Create the user in the StreamChat database. This must come last in the transaction,
      // since we don't have a way to roll it back in the event that the transaction fails.
      await streamServerClient.upsertUser({
        id: userId,
        username,
        name: username,
      });
    });

    // Create a session for the user
    await createSession(userId);

    // Redirect the user to the main application page
    return redirect("/");
  } catch (error) {
    // If the error is a result of redirecting, then we need to re-throw it to continue
    if (isRedirectError(error)) throw error;

    // Otherwise, log the error and return an error message
    console.error(error);
    return { error: "An error occurred while signing up. Please try again." };
  }
}
