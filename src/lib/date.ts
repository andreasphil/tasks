import dayjs from "dayjs";
import "dayjs/locale/de";

dayjs.locale("de");

export function format(date: Date, format = "YYYY-MM-DD"): string {
  return dayjs(date).format(format);
}

export function today(): Date {
  return dayjs().endOf("day").toDate();
}

export function tomorrow(): Date {
  return dayjs().add(1, "day").endOf("day").toDate();
}

export function nextWeek(): Date {
  return dayjs().add(1, "week").startOf("week").toDate();
}
