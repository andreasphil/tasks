import dayjs from "dayjs";

/* -------------------------------------------------- *
 * Formatting                                         *
 * -------------------------------------------------- */

export function getDateHint(date: Date | string): string {
  const selected = dayjs(date);
  const day = selected.format("dddd");
  const diff = Math.ceil(selected.diff(dayjs(), "days", true));

  let readableDiff = "today";
  if (diff === -1) readableDiff = "yesterday";
  else if (diff === 1) readableDiff = "tomorrow";
  else if (diff > 1) readableDiff = `in ${diff} days`;
  else if (diff < -1) readableDiff = `${Math.abs(diff)} days ago`;

  return `${day} (${readableDiff})`;
}
