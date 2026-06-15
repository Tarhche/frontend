"use server";

import {cookies} from "next/headers";
import {revalidatePath} from "next/cache";
import axios from "axios";
import jwt from "jsonwebtoken";
import {updateUserProfile} from "@/dal/private/profile";
import {APP_PATHS} from "@/lib/app-paths";
import {INTERNAL_BACKEND_URL} from "@/constants/envs";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  LANGUAGE_COOKIE_NAME,
} from "@/constants/strings";
import {ACCESS_TOKEN_EXP, REFRESH_TOKEN_EXP} from "@/constants/numbers";

// Server-side token refresh. Must use the INTERNAL backend URL: this runs inside
// the container, where the public URL (localhost) points at the container
// itself, not the backend.
async function refreshTokensServer(
  refreshToken: string,
): Promise<{access_token: string; refresh_token: string}> {
  const {data} = await axios.post(
    `${INTERNAL_BACKEND_URL}/api/auth/token/refresh`,
    {token: refreshToken},
  );
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
}
import {
  captureFormValues,
  extractValidationErrors,
  type FormValues,
  type ValidationErrorMap,
} from "@/lib/api/validation-errors";

const LANGUAGE_COOKIE_MAX_AGE = 31536000; // 1 year

type FormState = {
  success: boolean | null;
  // True when the profile language changed (so the client knows to reload and
  // pick up the new language + direction).
  languageChanged?: boolean;
  errors?: ValidationErrorMap;
  values?: FormValues;
};

function languageFromAccessToken(token?: string): string | undefined {
  if (!token) {
    return undefined;
  }
  const decoded = jwt.decode(token);
  return typeof decoded === "object" && decoded !== null
    ? ((decoded as Record<string, unknown>).lang as string | undefined)
    : undefined;
}

// Propagates the saved profile language to where each surface reads it:
//   - the access-token `lang` claim — the DASHBOARD always follows this, so we
//     re-issue tokens (the backend re-reads the updated user) so it updates
//     immediately without re-login;
//   - the `lang` cookie — PUBLIC pages follow this, so they default to the
//     profile language after a save (the user can still switch them later).
// Returns whether the language actually changed.
async function syncProfileLanguage(newLanguage: string): Promise<boolean> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  const currentLanguage = languageFromAccessToken(
    store.get(ACCESS_TOKEN_COOKIE_NAME)?.value,
  );

  if (!newLanguage || newLanguage === currentLanguage) {
    return false;
  }

  // Public pages follow the profile after a save.
  store.set(LANGUAGE_COOKIE_NAME, newLanguage, {
    maxAge: LANGUAGE_COOKIE_MAX_AGE,
    path: "/",
  });

  // Re-issue tokens so the dashboard (token-driven) follows the new language.
  // Best-effort: if it fails, the profile is still saved and the token catches
  // up on the next natural refresh/login.
  if (refreshToken) {
    try {
      const tokens = await refreshTokensServer(refreshToken);
      store.set(ACCESS_TOKEN_COOKIE_NAME, tokens.access_token, {
        maxAge: ACCESS_TOKEN_EXP,
        httpOnly: false,
        secure: true,
      });
      store.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refresh_token, {
        maxAge: REFRESH_TOKEN_EXP,
        httpOnly: false,
        secure: true,
      });
    } catch {
      // ignore — see note above
    }
  }

  return true;
}

export async function updateProfileAction(
  formState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (key.includes("$") === false && Boolean(value)) {
      values[key] = value.toString() || "";
    }
  });

  try {
    await updateUserProfile(values);
  } catch (err) {
    const echoed = captureFormValues(formData);
    const errors = extractValidationErrors(err);
    if (errors) {
      return {success: false, errors, values: echoed};
    }
    return {success: false, values: echoed};
  }

  const languageChanged = await syncProfileLanguage(values["language_code"]);

  revalidatePath(APP_PATHS.dashboard.profile.index);
  return {success: true, languageChanged};
}
