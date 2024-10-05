import { createSession, google } from "@/lib/auth";
import ky from "@/lib/ky";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { slugify } from "@/lib/utils";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// ################################################################################################

export async function GET(request: NextRequest) {
  // If an error occurred, redirect the user back to the login page
  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    console.error(`OAuth error: ${error}`);
    return new Response(null, {
      status: 302,
      headers: { Location: "/login?error=oauth_request_error" },
    });
  }

  // The state and codeVerifier we stored in the user's cookies during the authorization request
  const storedState = cookies().get("state")?.value;
  const storedCodeVerifier = cookies().get("code_verifier")?.value;

  // The state returned by Google (should match the state we sent in the authorization request)
  const state = request.nextUrl.searchParams.get("state");

  // The authorization code returned by Google, used to exchange for access and refresh tokens
  const code = request.nextUrl.searchParams.get("code");

  // If any of the required data is missing or doesn't match, redirect back to the login page
  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    console.error("OAuth callback failed: Missing data or state mismatch");
    return new Response(null, {
      status: 302,
      headers: { Location: "/login?error=auth_failed" },
    });
  }

  try {
    // Exchange the authorization code for access and refresh tokens
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier,
    );

    // Get the user's information from Google
    const googleUser = await ky
      .get("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })
      .json<{ id: string; name: string; picture?: string }>();

    // Check if the user already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: {
        googleId: googleUser.id,
      },
    });

    if (existingUser) {
      // Update the user's avatar URL if it has changed
      if (googleUser.picture && googleUser.picture !== existingUser.avatarUrl) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { avatarUrl: googleUser.picture },
        });
      }

      // Create a session for the user
      await createSession(existingUser.id);

      // Redirect the user to the main application page
      return new Response(null, {
        status: 302,
        headers: { Location: "/" },
      });
    }

    // Generate a unique ID for the user
    // NOTE: Another valid option would be to allow Prisma to auto-generate a CUID
    const userId = generateIdFromEntropySize(10);

    // Generate a username for the user
    const username = slugify(googleUser.name) + "-" + userId.slice(0, 4);

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Create the user in the database
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: googleUser.name,
          googleId: googleUser.id,
          avatarUrl: googleUser.picture,
        },
      });

      // Create the user in the StreamChat database. This must come last in the transaction,
      // since we don't have a way to roll it back in the event that the transaction fails.
      await streamServerClient.upsertUser({
        id: userId,
        username,
        name: username,
        image: googleUser.picture,
      });
    });

    // Create a session for the user
    await createSession(userId);

    // Redirect the user to the main application page
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  } catch (error) {
    console.error("OAuth error:", error);

    let redirectUrl = "/login?error=";

    if (error instanceof OAuth2RequestError) {
      redirectUrl += "oauth_request_error";
    } else {
      redirectUrl += "unknown_error";
    }

    return new Response(null, {
      status: 302,
      headers: { Location: redirectUrl },
    });
  }
}
