import { Metadata } from "next";
import LoginForm from "./login-form";
import Link from "next/link";
import loginImage from "@/assets/login-image.jpg";
import Image from "next/image";
import GoogleSigninButton from "./google-signin-button";

// ################################################################################################

export const metadata: Metadata = {
  title: "Login",
};

export default function Page() {
  return (
    <main className="flex h-screen items-center justify-center p-5">
      <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="w-full space-y-10 overflow-y-auto px-4 py-10 md:w-1/2 md:px-10">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Log in</h1>
            <p className="text-muted-foreground">Welcome back to bugbook!</p>
          </div>
          <div className="space-y-5">
            <GoogleSigninButton />
            <div className="flex items-center gap-3">
              <div className="h-[2px] flex-1 bg-muted" />
              <span className="text-muted-foreground">or</span>
              <div className="h-[2px] flex-1 bg-muted" />
            </div>
            <LoginForm />
            <Link href="/signup" className="block text-center hover:underline">
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </div>
        <Image
          src={loginImage}
          alt=""
          className="hidden w-1/2 object-cover md:block"
        />
      </div>
    </main>
  );
}
