import {AxiosRequestConfig} from "axios";
import {publicDalDriver} from "./public-dal-driver";

export type Language = {
  code: string;
  name: string;
};

export type LanguagesResponse = {
  items: Language[];
  default_language: Language;
};

export async function fetchLanguages(
  config?: AxiosRequestConfig,
): Promise<LanguagesResponse> {
  const response = await publicDalDriver.get("languages", config);
  return response.data;
}
