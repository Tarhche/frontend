import ClientInterceptor from "../ClientInterceptor";
import SharedAuthInterceptor from "@/lib/auth/interception/interceptors/shared/SharedAuthInterceptor";

export default class ClientAuthInterceptor extends ClientInterceptor {
  add() {
    const sharedAuthInspector = new SharedAuthInterceptor(this.dal, this);
    sharedAuthInspector.add();
  }
}
