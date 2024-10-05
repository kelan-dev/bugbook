"use server";

import { lucia, validateRequest } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ################################################################################################

export async function logout() {
  // Check that the user has an active session
  const { session } = await validateRequest();

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Invalidate the session record in the database
  await lucia.invalidateSession(session.id);

  // Remove the user's session cookie by overwriting it with a blank
  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  // With both database record and cookie invalidated, the user is now logged out.
  // Redirect the user to the login page.
  return redirect("/login");
}
