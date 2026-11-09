/**
 * Utilitas tanggal untuk input `datetime-local` yang berlabel WIB.
 *
 * `new Date("2026-11-10T19:00")` menafsirkan nilai sebagai zona waktu server.
 * Di Vercel (UTC) itu berarti acara bergeser 7 jam dari WIB. Fungsi ini
 * mem-parse komponen tanggal secara eksplisit sebagai UTC+7.
 */
export function parseWibDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour > 23 || minute > 59 || second > 59) return null;

  // Tolak tanggal yang tidak ada (mis. 31 Februari) sebelum digeser ke UTC.
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day, hour - 7, minute, second));
  return Number.isNaN(date.getTime()) ? null : date;
}
