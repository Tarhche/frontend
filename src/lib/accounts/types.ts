/** A signed-in account the browser can go back to. */
export type StoredAccount = {
  /** the session's own id — see `sessionId`. */
  id: string;
  uuid: string;
  name?: string;
  username?: string;
  avatar?: string;
  /**
   * who opened this session to be seen as `uuid`, when somebody did. A shadow
   * session is shown as such wherever the accounts are listed.
   */
  impersonatorUuid?: string;
  impersonatorName?: string;
  /**
   * what makes the account switchable: a fresh access token is minted from it.
   * Access tokens last three minutes, so storing one would be storing nothing.
   */
  refreshToken: string;
  /** when this was last written, which is what gets pruned first. */
  rememberedAt: number;
};
