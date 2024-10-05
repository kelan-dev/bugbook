import { validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuthProvider from "./auth-provider";
import NavBar from "./navbar";
import MenuBar from "./menu-bar";

// ################################################################################################

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use the auth context to provide the user and session to client components
  const auth = await validateRequest();
  if (!auth.user) redirect("/login");

  return (
    <AuthProvider auth={auth}>
      <div className="flex min-h-screen flex-col">
        <NavBar />
        <div className="mx-auto flex w-full max-w-7xl grow gap-5 p-5">
          <MenuBar className="sticky top-[5.25rem] hidden h-fit flex-none space-y-3 rounded-2xl bg-card px-3 py-5 shadow-sm sm:block lg:px-5 xl:w-80" />
          {children}
        </div>
        <MenuBar className="sticky bottom-0 flex w-full justify-center gap-5 border-t bg-card p-3 sm:hidden" />
      </div>
    </AuthProvider>
  );
}
