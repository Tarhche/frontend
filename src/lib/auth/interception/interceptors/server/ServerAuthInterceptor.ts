import ServerInterceptor from "../ServerInterceptor";
import SharedAuthInterceptor from "@/lib/auth/interception/interceptors/shared/SharedAuthInterceptor";

export default class ServerAuthInterceptor extends ServerInterceptor {
  add() {
    const sharedAuthInspector = new SharedAuthInterceptor(this.dal, this);
    sharedAuthInspector.add();
  }
}
