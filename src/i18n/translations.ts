import type {Direction, Locale} from "./config";
import en from "./dictionaries/en.json";
import fa from "./dictionaries/fa.json";

// Per-language JSON dictionaries are the single source of truth. Each holds a
// `config` block (text direction) plus the namespaced phrase translations
// (`common`, `nav`, `articles`, …). To change/add a string, edit the JSON files
// in ./dictionaries.
type Dictionary = {config: {direction: Direction}} & Record<string, unknown>;
type Messages = Omit<Dictionary, "config">;

function adapt(dictionary: Dictionary): {direction: Direction; messages: Messages} {
  const {config, ...messages} = dictionary;
  return {direction: config.direction, messages};
}

export const translations: Record<
  Locale,
  {direction: Direction; messages: Messages}
> = {
  en: adapt(en as Dictionary),
  fa: adapt(fa as Dictionary),
};
