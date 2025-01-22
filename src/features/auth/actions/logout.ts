"use server";
import {cookies} from "next/headers";

export async function logout() {
  const cookiesStore = cookies();
  const cookiesToRemove = cookiesStore.getAll();
  cookiesToRemove.forEach(({name}) => {
    cookiesStore.set(name, "", {maxAge: -1});
  });
}
