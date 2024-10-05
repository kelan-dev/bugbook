"use server";

import prisma from "@/lib/prisma";
import argon2 from "@node-rs/argon2";
import { createSession, lucia } from "@/lib/auth";
import { loginSchema, LoginValues } from "@/lib/validation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";

// ################################################################################################

export async function login(values: LoginValues): Promise<{ error: string }> {
  try {
    // Validate the data with Zod
    const { username, password } = loginSchema.parse(values);

    // Get the user from the database
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    // No password hash indicates an OAuth user
    if (!existingUser || !existingUser.passwordHash) {
      return { error: "Invalid username or password" };
    }

    // Verify the password is correct
    const passwordsMatch = await argon2.verify(
      existingUser.passwordHash,
      password,
      {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      },
    );

    if (!passwordsMatch) {
      return { error: "Invalid username or password" };
    }

    // Create a session for the user
    await createSession(existingUser.id);

    // Redirect the user to the main application page
    return redirect("/");
  } catch (error) {
    // If the error is a result of redirecting, then we need to re-throw it to continue
    if (isRedirectError(error)) throw error;

    // Otherwise, log the error and return an error message
    console.error(error);
    return { error: "An error occurred while logging in" };
  }
}
