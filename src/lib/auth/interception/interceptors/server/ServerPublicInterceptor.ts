import ServerInterceptor from "../ServerInterceptor";
import {AxiosError} from "axios";
import {notFound} from "next/navigation";
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

          throw new DALDriverError(error.message, error.status || 500, {
            data: error.response?.data ?? {},
          });
        }

        console.error(error)
        console.log(JSON.stringify(error?.response?.data))

        throw new DALDriverError(
          "Unexpected error while fetching data from backend",
          500,
        );
      },
    );
  }
}
