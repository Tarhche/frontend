import {privateDalDriver} from "./private-dal-driver";

export async function fetchUserProfile() {
  const response = await privateDalDriver.get("dashboard/profile");
  return response;
}

export async function updateUserProfile(data: any) {
  return await privateDalDriver.put("dashboard/profile", data);
}
