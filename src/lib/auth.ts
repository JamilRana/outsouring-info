// src/lib/auth.ts
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./authOptions";

export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  return session?.user;
};

export const requireAuth = async (roles: string[] = []) => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return user;
};
