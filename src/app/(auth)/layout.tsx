import { validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";

// ################################################################################################

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await validateRequest();
  if (auth.user) redirect("/");

  return <>{children}</>;
}
