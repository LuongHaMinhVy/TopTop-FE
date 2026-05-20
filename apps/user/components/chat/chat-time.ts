import { differenceInHours, format } from "date-fns";

export function formatChatTimestamp(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return differenceInHours(new Date(), date) >= 24
    ? format(date, "dd/MM/yyyy")
    : format(date, "HH:mm");
}
