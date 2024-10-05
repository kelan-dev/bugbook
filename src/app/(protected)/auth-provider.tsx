"use client";

import { Session, User } from "lucia";
import { createContext, useContext } from "react";

// ################################################################################################

interface AuthContext {
  user: User;
  session: Session;
}

const AuthContext = createContext<AuthContext | null>(null);

export default function AuthProvider({
  children,
  auth,
}: React.PropsWithChildren<{ auth: AuthContext }>) {
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
