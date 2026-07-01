export type ApplicationDetailField = {
  label: string;
  value: string;
};

const SHORT_LABELS: Record<string, string> = {
  Age: "Age",
  "How they relate to Anew": "How they relate",
  Location: "Location",
  "Looking for": "Looking for",
  "Top 3 values": "Top 3 values",
  "What brings them to Anew": "What brings them here",
  "Heard about us via": "Heard about us",
};

/** Parses the newline key: value block stored in applications.message */
export function parseApplicationDetails(message: string | null): ApplicationDetailField[] {
  if (!message?.trim()) return [];

  return message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf(": ");
      if (sep === -1) {
        return { label: "Note", value: line };
      }
      const rawLabel = line.slice(0, sep).trim();
      const label = SHORT_LABELS[rawLabel] ?? rawLabel;
      return { label, value: line.slice(sep + 2).trim() };
    });
}
