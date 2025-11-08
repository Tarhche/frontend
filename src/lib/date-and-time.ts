export function isGregorianStartDateTime(date: Date | string) {
  const targetDate = new Date(date);

  return (
    targetDate.getUTCFullYear() === 1 &&
    targetDate.getUTCMonth() === 0 &&
    targetDate.getUTCDay() === 1 &&
    targetDate.getUTCHours() === 0 &&
    targetDate.getUTCMinutes() === 0 &&
    targetDate.getUTCSeconds() === 0
  );
}

export function formatDate(dateString: string) {
  if (!dateString) {
    return "";
  }

  const formattedDate = dateString
    ? new Date(dateString).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return formattedDate;
}
