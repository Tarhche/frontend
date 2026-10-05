import {ScopeSwitch} from "@/components/scope-switch";
import {getServerDictionary} from "@/i18n/server";
import {PERMISSIONS} from "@/lib/app-permissions";
import {getUserPermissions, getUserUuid, hasPermission} from "@/lib/auth";
import {dockerVmSource} from "../../server";
import {DockerObjectsPage, type DockerObjects} from "./docker-objects-page";

type Props = {
  objects: DockerObjects;

  /** the VM the address names, if it names one. */
  initialVm?: string;
};

/**
 * Everybody's Docker VMs, or one's own, for a page that looks into one. What
 * the person holds is read here, on the server, and handed to the page, which
 * works out what may be done in whichever VM is picked from whose VM it is.
 */
export async function DockerObjectsScopes({objects, initialVm}: Props) {
  const {t} = await getServerDictionary();
  const permissions = (await getUserPermissions()) ?? [];
  const me = await getUserUuid();

  const [allVms, myVms] = await Promise.all([
    dockerVmSource("all", permissions),
    dockerVmSource("mine", permissions),
  ]);

  return (
    <ScopeSwitch
      canSeeAll={hasPermission(permissions, [
        PERMISSIONS.workload.containers.INDEX,
      ])}
      canSeeMine={hasPermission(permissions, [
        PERMISSIONS.self.workload.containers.INDEX,
      ])}
      labels={{
        all: t("dockerVms.tabs.all"),
        mine: t("dockerVms.tabs.mine"),
      }}
      all={
        <DockerObjectsPage
          objects={objects}
          scope="all"
          permissions={permissions}
          me={me}
          vmSource={allVms}
          initialVm={initialVm}
        />
      }
      mine={
        <DockerObjectsPage
          objects={objects}
          scope="mine"
          permissions={permissions}
          me={me}
          vmSource={myVms}
          initialVm={initialVm}
        />
      }
    />
  );
}
