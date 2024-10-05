// https://lucia-auth.com/getting-started/nextjs-app
// https://lucia-auth.com/database/prisma

import prisma from "./prisma";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import {
  Lucia,
  RegisteredDatabaseSessionAttributes,
  Session,
  User,
} from "lucia";
import { cache } from "react";
import { cookies } from "next/headers";
import { Google } from "arctic";

// ################################################################################################

// Create an adapter for the Prisma client
const adapter = new PrismaAdapter(prisma.session, prisma.user);

// Create a Lucia instance with the Prisma adapter
export const lucia = new Lucia(adapter, {
  // Session cookie configuration
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  // Return attributes that you want available in the session on the client side
  getUserAttributes: (attributes: DatabaseUserAttributes) => {
    return {
      id: attributes.id,
      username: attributes.username,
      displayName: attributes.displayName,
      avatarUrl: attributes.avatarUrl,
      googleId: attributes.googleId,
    };
  },
});

// Attributes that should be available in the session on the client side
interface DatabaseUserAttributes {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  googleId: string | null;
}

// Register the Lucia instance type and DatabaseUserAttributes interface
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

// Arctic utility is used for Google OAuth integration
export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/login/google/callback`,
);

// Create a session record in the database and a session cookie for the given user.
// With both of these created, the user is now considered logged in.
export async function createSession(
  userId: User["id"],
  attributes: RegisteredDatabaseSessionAttributes = {},
  options?: { sessionId?: string },
) {
  const session = await lucia.createSession(userId, attributes, options);
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
}

// Check for the session cookie, validate it, and set a new cookie if necessary.
// Wrapping with `cache` ensures that only one database call is made per HTTP request.
// This function can be used in server components/actions to get the current user and session.
export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    // Attempt to get the session ID from the cookies
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    // If the session ID is not found in the request, return null
    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    // Verify that the session ID has a matching database session record. The user is
    // only considered authenticated if both the cookie and database record exist.
    const result = await lucia.validateSession(sessionId);
    try {
      // If a database record exists for the given ID and hasn't expired, then...
      if (result.session && result.session.fresh) {
        // Create a new session cookie with the session ID
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        // Set the session cookie in the response
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
      // If a database record doesn't exist for the given ID, then...
      if (!result.session) {
        // Create a blank session cookie
        const sessionCookie = lucia.createBlankSessionCookie();
        // Set the session cookie in the response
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
    } catch {
      // Next.js throws when you attempt to set cookie when rendering page.
      // This is why we need to catch it here and prevent it from bubbling.
    }
    // Return the validated session
    return result;
  },
);
