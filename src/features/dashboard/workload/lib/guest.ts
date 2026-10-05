/**
 * Whose a snippet the code runner runs is: whoever was reading the page it was
 * run from, signed in or not. The API says so as this owner_uuid, which no
 * user's uuid ever is, so it names nobody the dashboard can put a face to.
 */
export const GUEST_OWNER_UUID = "guest";

/** Whether an owner uuid is the guest's. */
export function isGuest(ownerUuid: string | null | undefined): boolean {
  return ownerUuid === GUEST_OWNER_UUID;
}
