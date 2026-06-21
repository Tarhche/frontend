import {AxiosRequestConfig} from "axios";
import {LANGUAGE_CODE_HEADER} from "@/constants";
import {privateDalDriver} from "./private-dal-driver";

export async function fetchAllComments(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get("dashboard/comments", config);
  return response.data;
}

export async function fetchUserComments(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get("dashboard/my/comments", config);
  return response.data;
}

export async function fetchUsersDetailComments(
  id: string,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(
    `dashboard/comments/${id}`,
    config,
  );
  return response.data;
}

export async function updateUserComment(body: any) {
  const response = await privateDalDriver.put(`dashboard/comments`, {
    object_type: "article",
    ...body,
  });
  return response.data;
}

export async function deleteComment(commentId: string) {
  return await privateDalDriver.delete(`/dashboard/comments/${commentId}`);
}

export async function deleteSelfComment(commentId: string) {
  return await privateDalDriver.delete(`/dashboard/my/comments/${commentId}`);
}

export async function createArticleComment(body: {
  object_uuid: string;
  body: string;
  parent_uuid: string;
  language_code: string;
}) {
  // The body keeps `language_code` (the backend validates/persists it on the
  // comment); the header additionally scopes the request (e.g. validation
  // messages) to the article's language rather than the author's profile.
  const response = await privateDalDriver.post(
    "comments",
    {
      ...body,
      object_type: "article",
    },
    {headers: {[LANGUAGE_CODE_HEADER]: body.language_code}},
  );
  return response.data;
}
