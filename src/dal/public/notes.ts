import {cache} from "react";
import {LANGUAGE_CODE_HEADER} from "@/constants";
import {publicDalDriver} from "./public-dal-driver";

// Note detail is keyed by the correlation uuid (shared across translations),
// resolved to a single translation via the language code.
//
// Cached per-request so the page and its metadata share a single fetch. Returns
// null when the note has no translation for the requested language, or when its
// author keeps their notes private (404) instead of throwing notFound(), so the
// page can render the not-found UI as plain content — reliable even mid-stream
// behind the route's loading skeleton.
export const fetchNoteByCorrelationUUID = cache(
  async (correlationUUID: string, languageCode?: string) => {
    const response = await publicDalDriver.get(`notes/${correlationUUID}`, {
      headers: languageCode
        ? {[LANGUAGE_CODE_HEADER]: languageCode}
        : undefined,
      validateStatus: (status) => status < 500,
    });
    if (response.status === 404) {
      return null;
    }
    return response.data;
  },
);
