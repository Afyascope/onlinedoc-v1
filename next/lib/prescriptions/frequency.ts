export const PRESCRIPTION_FREQUENCY_OPTIONS = [
  { value: "OD", label: "Once daily" },
  { value: "BD", label: "Twice daily" },
  { value: "TID", label: "Three times daily" },
  { value: "QID", label: "Four times daily" },
  { value: "PRN", label: "As needed" },
  { value: "STAT", label: "Immediately, single dose" },
  { value: "Nocte", label: "At night" },
  { value: "Weekly", label: "Once weekly" },
  { value: "Monthly", label: "Once monthly" },
] as const;

export type PrescriptionFrequencyValue =
  (typeof PRESCRIPTION_FREQUENCY_OPTIONS)[number]["value"];

const LABELS = new Map<string, string>(
  PRESCRIPTION_FREQUENCY_OPTIONS.map((option) => [option.value, option.label]),
);

export function isSupportedPrescriptionFrequency(
  value: string | null | undefined,
): value is PrescriptionFrequencyValue {
  if (typeof value !== "string") return false;
  return LABELS.has(value.trim());
}

/**
 * Validates a frequency selected for a new prescription.
 *
 * Existing rows are never passed through this function: legacy free-text
 * values stay untouched and continue to render through
 * `prescriptionFrequencyLabel`. New selections must use a standard value.
 */
export function parseNewPrescriptionFrequency(value: string): PrescriptionFrequencyValue {
  const trimmed = value.trim();
  if (!isSupportedPrescriptionFrequency(trimmed)) {
    throw new Error("Prescription frequency must be one of the supported options");
  }
  return trimmed;
}

/**
 * Returns the patient-facing label for a stored frequency.
 *
 * Unknown values are legacy free text and are returned unchanged. They are
 * deliberately not mapped onto a standard regimen.
 */
export function prescriptionFrequencyLabel(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return LABELS.get(trimmed) ?? trimmed;
}
