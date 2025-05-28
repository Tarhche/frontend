import {getUserPermissions} from "@/lib/auth";
import {hasPermission, Operator} from "@/lib/auth";
import {Permissions} from "@/lib/app-permissions";
import {redirect} from "next/navigation";

type Props = {
  allowedPermissions: Permissions[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  operator?: Operator;
};

export async function PermissionGuard({
  allowedPermissions,
  children,
  fallback = null,
  operator = "OR",
}: Props) {
  const userPermissions = await getUserPermissions();
  if (userPermissions === null) {
    // An invalid token is set
    redirect('/auth/login');
  }
  const hasAccess = hasPermission(
    userPermissions,
    allowedPermissions,
    operator,
  );

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
