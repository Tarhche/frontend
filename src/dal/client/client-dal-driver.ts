import axios from "axios";
import {PUBLIC_BACKEND_URL} from "@/constants";
import {attachAuthHeaderClient} from "@/lib/auth/dal/attachAuthHeaderClient";
import {clientRefreshOn401} from "@/lib/auth/dal/clientRefreshOn401";

const BASE_URL = `${PUBLIC_BACKEND_URL}/api`;
const clientDalDriver = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

attachAuthHeaderClient(clientDalDriver);
clientRefreshOn401(clientDalDriver);

export {clientDalDriver};
