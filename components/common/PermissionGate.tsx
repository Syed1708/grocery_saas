// components/common/PermissionGate.tsx
"use client";

import { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";
import { PermissionKey } from "@/types/rbac";

interface PermissionGateProps {
  permission: PermissionKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { hasPermission } = usePermission();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}