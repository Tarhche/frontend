import {ScopeSwitch} from "@/components/scope-switch";
import {getServerDictionary} from "@/i18n/server";
import {PERMISSIONS} from "@/lib/app-permissions";
import {getUserPermissions, hasPermission} from "@/lib/auth";
import {dockerMay} from "../../permissions";
import {dockerVmSource} from "../../server";
import {DockerObjectsPage, type DockerObjects} from "./docker-objects-page";

type Props = {
  objects: DockerObjects;

  /** the VM the address names, if it names one. */
  initialVm?: string;
};

/**
 * Everybody's Docker VMs, or one's own, for a page that looks into one. What
 * the person may do in each is worked out here, on the server, and handed to
 * the page that asks the VMs.
 */
export async function DockerObjectsScopes({objects, initialVm}: Props) {
  const {t} = await getServerDictionary();
  const permissions = (await getUserPermissions()) ?? [];

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
          may={dockerMay(permissions, "all")}
          vmSource={allVms}
          initialVm={initialVm}
        />
      }
      mine={
        <DockerObjectsPage
          objects={objects}
          scope="mine"
          may={dockerMay(permissions, "mine")}
          vmSource={myVms}
          initialVm={initialVm}
        />
      }
    />
  );
}
