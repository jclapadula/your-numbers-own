import { toZonedTime } from "date-fns-tz";

export type ZonedDate = Date & { _zoned: true };

export const toZonedDate = (date: Date, timezone: string): ZonedDate => {
  const zonedDate = toZonedTime(date, timezone);

  return zonedDate as ZonedDate;
};
