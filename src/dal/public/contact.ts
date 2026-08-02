import {publicDalDriver} from "./public-dal-driver";

// "Contact us" messages come from visitors, logged in or not, so they go through
// the public driver — the backend requires no authentication for them.
export async function sendContactMessage(body: {
  subject: string;
  body: string;
  email: string;
  phone: string;
}) {
  const response = await publicDalDriver.post("contact-us", body);
  return response.data;
}
