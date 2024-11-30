import {AxiosRequestConfig} from "axios";
import {dalDriver} from "@/dal";

export async function fetchAllComments(config?: AxiosRequestConfig) {
  const response = await dalDriver.get("dashboard/comments", config);
  return response.data;
}

export async function fetchUserComments(config?: AxiosRequestConfig) {
  const response = await dalDriver.get("dashboard/my/comments", config);
  return response.data;
}

export async function fetchUsersDetailComments(
  id: string,
  config?: AxiosRequestConfig,
) {
  const response = await dalDriver.get(`dashboard/comments/${id}`, config);
  return response.data;
}

export async function updateUserComment(body: any) {
  const response = await dalDriver.put(`dashboard/comments`, {
    object_type: "article",
    ...body,
  });
  return response.data;
}

export async function fetchArticleComments(articleUUID: string) {
  const article = await dalDriver.get("comments", {
    params: {
      object_type: "article",
      object_uuid: articleUUID,
    },
  });
  return article.data;
}

export async function createArticleComment(body: {
  object_uuid: string;
  body: string;
  parent_uuid: string;
}) {
  const response = await dalDriver.post("comments", {
    ...body,
    object_type: "article",
  });
  return response.data;
}

export async function deleteComment(commentId: string) {
  return await dalDriver.delete(`/dashboard/comments/${commentId}`);
}
