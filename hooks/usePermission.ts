// hooks/use-permission.ts
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DEFAULT_ROLE_PERMISSIONS, PermissionKey, UserRole } from "@/types/rbac";
import { getMyPermissionsAction } from "@/app/actions/users-actions";

export function usePermission() {
  const { data: session, status } = useSession();
  const role = session?.user?.role as UserRole;
  const isOwner = role === "OWNER";

  // Initialize with session token fallback for instant first render
  const [permissions, setPermissions] = useState<string[] | null>(
    (session?.user?.customPermissions as string[]) || null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function syncPermissions() {
      if (status === "authenticated" && !isOwner) {
        try {
          const res = await getMyPermissionsAction();
          if (res.success && res.permissions) {
            setPermissions(res.permissions);
          }
        } catch (err) {
          console.error("Failed to sync permissions:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    // Sync on mount
    syncPermissions();

    // 🛡️ Instant Sync: Re-fetch permissions the moment user refocuses the browser tab/window
    window.addEventListener("focus", syncPermissions);
    return () => window.removeEventListener("focus", syncPermissions);
  }, [status, isOwner]);

  function hasPermission(permission: PermissionKey): boolean {
    if (!role) return false;
    if (isOwner) return true;

    const activePermissions = permissions !== null
      ? permissions
      : (DEFAULT_ROLE_PERMISSIONS[role] || []);

    return activePermissions.includes(permission);
  }

  return { hasPermission, isOwner, role, loading };
}