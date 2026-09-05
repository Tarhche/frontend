/**
 * What a container's state is called in the reader's own language.
 *
 * The runner names its states in English, since that is what they are inside
 * it. What is shown of them is translated, and a state nobody has named yet
 * falls back to what the runner called it rather than to nothing.
 */
export function containerStateLabel(
  t: (key: string) => string,
  state: string,
): string {
  const key = `containers.states.${state}`;
  const translated = t(key);

  return translated && translated !== key ? translated : state;
}
