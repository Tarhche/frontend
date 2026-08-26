import ServerInterceptor from "../ServerInterceptor";
import {AxiosError} from "axios";
import {forbidden, notFound} from "next/navigation";
import {DALDriverError} from "@/dal/dal-driver-error";

export default class ServerPublicInterceptor extends ServerInterceptor {
  add() {
    this.dal.interceptors.response.use(
      (value) => value,
      (error) => {
        if (error instanceof AxiosError) {
          if (error.status === 404) {
            notFound();
          }

          if (error.status === 403) {
            forbidden();
          }

          throw new DALDriverError(error.message, error.status || 500, {
            data: error.response?.data ?? {},
          });
        }

        throw error;
      },
    );
  }
}
