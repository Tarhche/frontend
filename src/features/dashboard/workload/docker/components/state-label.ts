import {type TFunction} from "@/i18n/dictionary";

/**
 * What a state is called in the reader's own language. The platform names its
 * states in English, since that is what they are inside it; a state nobody has
 * named here yet falls back to what it was called rather than to nothing.
 */
export function stateLabel(t: TFunction, namespace: string, state: string) {
  const key = `${namespace}.${state}`;
  const translated = t(key);

  return translated && translated !== key ? translated : state;
}
