/**
 * Vietnamese display labels for known credit types.
 * Falls back to a humanized form of the code if not listed.
 */
const CREDIT_LABELS: Record<string, string> = {
  ticket_general: "Lượt tư vấn bác sĩ",
  TICKET_GENERAL: "Lượt tư vấn bác sĩ",
};

export function formatCreditLabel(code: string): string {
  if (CREDIT_LABELS[code]) return CREDIT_LABELS[code];
  return code
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
