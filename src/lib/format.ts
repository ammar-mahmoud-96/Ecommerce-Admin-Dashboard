type FirestoreDate = { seconds?: number } | null | undefined;

export function toDate(value: FirestoreDate): Date | null {
  const seconds = value?.seconds;
  return typeof seconds === "number" ? new Date(seconds * 1000) : null;
}

export function toSeconds(value: FirestoreDate): number {
  return typeof value?.seconds === "number" ? value.seconds : 0;
}

export function formatPrice(value: number | undefined): string {
  return `EGP ${value ?? 0}`;
}

export function formatDate(value: FirestoreDate): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(value: FirestoreDate): string {
  const date = toDate(value);
  return date ? date.toLocaleDateString() : "—";
}

export function formatPhone(
  countryCode?: string | null,
  phone?: string | null,
): string {
  if (!phone) return "—";
  return `${countryCode ?? ""} ${phone}`.trim();
}

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escape(row[header])).join(","),
    ),
  ].join("\n");
}

export function downloadCsv(
  filename: string,
  rows: Array<Record<string, unknown>>,
): void {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
