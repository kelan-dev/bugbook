import { google } from "@/lib/auth";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";

// ################################################################################################

export async function GET() {
  // A random string used to prevent CSRF attacks
  const state = generateState();
  // A random string used to prevent authorization code interception attacks
  const codeVerifier = generateCodeVerifier();

  // Generate the URL to Google's OAuth consent screen
  const url = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ["profile", "email"],
  });

  // Store the state in a cookie on the client
  cookies().set("state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60,
    sameSite: "lax",
  });

  // Store the codeVerifier in a cookie on the client
  cookies().set("code_verifier", codeVerifier, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60,
    sameSite: "lax",
  });

  // Redirect the user to Google's OAuth consent screen
  return Response.redirect(url);
}
