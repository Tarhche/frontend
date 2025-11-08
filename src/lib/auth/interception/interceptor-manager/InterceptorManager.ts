import {AxiosInstance} from "axios";
import Interceptor from "@/lib/auth/interception/interceptors/Interceptor";

type InterceptorClass = new (...args: any[]) => Interceptor;

export default class InterceptorManager {
  private dal: AxiosInstance;

  private constructor(dal: AxiosInstance) {
    this.dal = dal;
  }

  public static create(dal: AxiosInstance): InterceptorManager {
    return new this(dal);
  }

  public add(interceptor: InterceptorClass | Interceptor): this {
    if (interceptor instanceof Interceptor) {
      interceptor.add();
    } else {
      new interceptor(this.dal).add();
    }

    return this;
  }
}
