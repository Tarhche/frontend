import {AxiosRequestConfig} from "axios";
import {clientDalDriver} from "@/dal/client/client-dal-driver";
import {privateDalDriver} from "./private-dal-driver";

export async function fetchFiles(config?: AxiosRequestConfig) {
  const response = await clientDalDriver.get("dashboard/files", config);

  return response.data;
}

export async function fetchMyFiles(config?: AxiosRequestConfig) {
  const response = await clientDalDriver.get("dashboard/my/files", config);

  return response.data;
}

export async function addNewFile(body: FormData) {
  return await clientDalDriver.post("dashboard/files", body, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function deleteFile(id: string) {
  return await privateDalDriver.delete(`dashboard/files/${id}`);
}

export async function deleteMyFile(id: string) {
  return await privateDalDriver.delete(`dashboard/my/files/${id}`);
}
