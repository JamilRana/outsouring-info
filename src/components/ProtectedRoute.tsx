"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: ("SUBMITTER" | "EXPORTER")[];
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (!allowedRoles.includes(session.user.role)) {
      router.push("/unauthorized");
    }
  }, [session, status, router, allowedRoles]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session || !allowedRoles.includes(session.user.role)) {
    return null;
  }

  return <>{children}</>;
}
