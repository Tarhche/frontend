import {AxiosRequestConfig} from "axios";
import {LANGUAGE_CODE_HEADER} from "@/constants";
import {type CommentObjectType} from "@/features/comments/types";
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
  const response = await privateDalDriver.put(`dashboard/comments`, body);
  return response.data;
}

export async function deleteComment(commentId: string) {
  return await privateDalDriver.delete(`/dashboard/comments/${commentId}`);
}

export async function deleteSelfComment(commentId: string) {
  return await privateDalDriver.delete(`/dashboard/my/comments/${commentId}`);
}

export async function createComment(body: {
  object_type: CommentObjectType;
  object_uuid: string;
  body: string;
  parent_uuid: string;
  language_code: string;
}) {
  // The body keeps `language_code` (the backend validates/persists it on the
  // comment); the header additionally scopes the request (e.g. validation
  // messages) to the content's language rather than the author's profile.
  const response = await privateDalDriver.post("comments", body, {
    headers: {[LANGUAGE_CODE_HEADER]: body.language_code},
  });
  return response.data;
}
