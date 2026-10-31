/** A name for a snapshot of a VM taken now, which somebody may keep. */
export function snapshotName(vmName: string, at: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}`;
  const time = `${pad(at.getHours())}${pad(at.getMinutes())}`;

  return `${vmName}-${day}-${time}`;
}
