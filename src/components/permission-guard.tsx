import {getUserPermissions} from "@/lib/auth";
import {hasPermission, Operator} from "@/lib/auth";
import {Permissions} from "@/lib/app-permissions";

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
  const hasAccess = hasPermission(
    userPermissions,
    allowedPermissions,
    operator,
  );

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
