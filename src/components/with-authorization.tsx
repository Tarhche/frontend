/**
 * The `withPermissions` HOC is designed to restrict access to pages based
 *  on user permissions.
 *
 * For conditional rendering of components based on user permissions,
 * consider using the `PermissionGuard` component located at
 * `src/components/permission-guard.tsx`.
 *
 * * This HOC is based on "PermissionGuard as well".
 */

import {Permissions} from "@/lib/app-permissions";
import {getUserPermissions, hasPermission, Operator} from "@/lib/auth";
import {PermissionDeniedError} from "@/components/errors/dashboard-permission-denied";
import {redirect} from "next/navigation";

type Options = {
  requiredPermissions: Permissions[];
  operator?: Operator;
  fallback?: React.ReactNode;
};

export function withPermissions(
  Component: React.ComponentType<any>,
  options: Options,
) {
  const {requiredPermissions, operator = "OR", fallback} = options;

  const wrappedComponent = async (props: any) => {
    const userPermissions = await getUserPermissions();

    if (userPermissions === null) {
      redirect("/auth/login");
    }

    const hasAccess = hasPermission(
      userPermissions,
      requiredPermissions,
      operator,
    );

    if (!hasAccess) {
      return fallback || <PermissionDeniedError />;
    }

    return <Component {...props} />;
  };

  return wrappedComponent;
}
