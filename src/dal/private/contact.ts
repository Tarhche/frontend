import {AxiosRequestConfig} from "axios";
import {privateDalDriver} from "./private-dal-driver";

export async function fetchContactMessages(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get("dashboard/contact-us", config);
  return response.data;
}

export async function fetchContactMessage(
  uuid: string,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(
    `dashboard/contact-us/${uuid}`,
    config,
  );
  return response.data;
}

export async function deleteContactMessage(uuid: string) {
  return await privateDalDriver.delete(`dashboard/contact-us/${uuid}`);
}

// The read timestamp itself is stamped by the backend; the caller only says
// which way the toggle went.
export async function markContactMessageAsRead(uuid: string, read: boolean) {
  const response = await privateDalDriver.put(
    `dashboard/contact-us/${uuid}/read`,
    {read},
  );
  return response.data;
}
