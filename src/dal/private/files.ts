import {AxiosRequestConfig} from "axios";
import {clientDalDriver} from "@/dal/client/client-dal-driver";

export async function fetchFiles(config?: AxiosRequestConfig) {
  const response = await clientDalDriver.get("dashboard/files", config);
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
  return await clientDalDriver.delete(`dashboard/files/${id}`);
}
