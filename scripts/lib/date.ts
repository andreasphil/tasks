const weekday = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
});

const relativeTIme = new Intl.RelativeTimeFormat(undefined, {
  style: "long",
  numeric: "auto",
});

export function getDateHint(date: Temporal.PlainDate | string): string {
  date =
    date instanceof Temporal.PlainDate ? date : Temporal.PlainDate.from(date);

  const diff = date.since(Temporal.Now.plainDateISO());

  return `${weekday.format(date)} (${relativeTIme.format(diff.days, "day")})`;
}
