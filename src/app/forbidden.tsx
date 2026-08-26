import {PermissionDeniedError} from "@/components/errors/dashboard-permission-denied";

export default function Forbidden() {
  return <PermissionDeniedError />;
}
