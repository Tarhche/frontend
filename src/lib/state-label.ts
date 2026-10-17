/**
 * What a state is called in the reader's own language.
 *
 * The platform names its states in English, since that is what they are inside
 * it: a task's, a VM's, a container's. What is shown of them is translated
 * under the namespace each is kept in, and a state nobody has named yet falls
 * back to what the platform called it rather than to nothing.
 */
export function stateLabel(
  t: (key: string) => string,
  namespace: string,
  state: string,
): string {
  const key = `${namespace}.${state}`;
  const translated = t(key);

  return translated && translated !== key ? translated : state;
}
