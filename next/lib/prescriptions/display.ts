import { prescriptionFrequencyLabel } from "./frequency";

export interface PrescriptionDisplayInput {
  medication: string;
  dosage?: string | null;
  dosageForm?: string | null;
  frequency?: string | null;
  duration?: string | null;
  route?: string | null;
  instructions?: string | null;
  strength?: string | null;
}

export interface PrescriptionDisplay {
  heading: string;
  instruction: string | null;
}

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

const COUNTABLE_FORMS = new Set([
  "tablet",
  "tab",
  "capsule",
  "cap",
  "pill",
  "caplet",
  "lozenge",
  "troche",
  "sachet",
  "suppository",
  "patch",
  "drop",
  "puff",
  "spray",
  "inhalation",
  "dose",
  "unit",
  "ampoule",
  "vial",
  "application",
  "wafer",
  "granule",
  "pellet",
  "syringe",
]);

const ROUTE_INSTRUCTIONS: Record<string, { verb: string; modifier?: string }> = {
  oral: { verb: "Take" },
  inhalation: { verb: "Inhale" },
  topical: { verb: "Apply" },
  transdermal: { verb: "Apply" },
  ophthalmic: { verb: "Instil" },
  otic: { verb: "Instil" },
  nasal: { verb: "Use" },
  rectal: { verb: "Insert" },
  vaginal: { verb: "Insert" },
  sublingual: { verb: "Take", modifier: "sublingually" },
  subcutaneous: { verb: "Administer", modifier: "subcutaneously" },
  intramuscular: { verb: "Administer", modifier: "intramuscularly" },
  intravenous: { verb: "Administer", modifier: "intravenously" },
  enteral: { verb: "Administer" },
  other: { verb: "Use" },
};

function clean(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed || null;
}

function lowerFirst(value: string): string {
  if (!/^[A-Z][a-z]/.test(value)) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function capitalizeFirst(value: string): string {
  if (!/^[a-z]/.test(value)) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function containsPhrase(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function numberWord(value: string): string | null {
  if (!/^\d+$/.test(value)) return null;
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 && index < NUMBER_WORDS.length
    ? NUMBER_WORDS[index]
    : null;
}

function singularize(unit: string): string {
  if (/ies$/i.test(unit)) return unit.replace(/ies$/i, "y");
  if (/(ches|shes|xes|zes)$/i.test(unit)) return unit.replace(/es$/i, "");
  if (/s$/i.test(unit) && !/ss$/i.test(unit)) return unit.slice(0, -1);
  return unit;
}

function pluralize(unit: string): string {
  if (/s$/i.test(unit)) return unit;
  if (/(ch|sh|x|z)$/i.test(unit)) return `${unit}es`;
  if (/[^aeiou]y$/i.test(unit)) return `${unit.slice(0, -1)}ies`;
  return `${unit}s`;
}

function countUnitPhrase(amount: string, unit: string): string | null {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return null;
  const word = numberWord(amount);
  if (!word && numeric > 12) return null;
  const normalizedUnit = numeric <= 1 ? singularize(unit) : pluralize(singularize(unit));
  return `${word ?? amount} ${normalizedUnit.toLowerCase()}`;
}

function amountUnit(value: string | null): { amount: string; unit: string } | null {
  if (!value) return null;
  const match = value.match(/^(\d+(?:\.\d+)?)\s*([A-Za-zµ%]+(?:(?:\s*\/\s*)\d*\s*[A-Za-zµ%]+)?)\.?$/);
  return match ? { amount: match[1], unit: match[2] } : null;
}

function formKey(value: string): string {
  return singularize(value.trim().toLowerCase());
}

function isCountableForm(value: string | null): boolean {
  return value ? COUNTABLE_FORMS.has(formKey(value)) : false;
}

function isCountableDose(parsed: { amount: string; unit: string } | null, form: string | null): boolean {
  if (!parsed) return false;
  const unit = formKey(parsed.unit);
  if (COUNTABLE_FORMS.has(unit)) return true;
  return form ? unit === formKey(form) : false;
}

function isMassStrength(dosage: string | null): boolean {
  return Boolean(dosage && /^\d+(?:\.\d+)?\s*(?:mg|mcg|µg|ug|g|kg|iu|%)\b/i.test(dosage));
}

function isQuantityDose(dosage: string | null, form: string | null): boolean {
  if (!dosage) return false;
  if (isCountableDose(amountUnit(dosage), form)) return true;
  return /^\d+(?:\.\d+)?$/.test(dosage) && Boolean(form);
}

function descriptiveDosage(input: PrescriptionDisplayInput): string | null {
  const dosage = clean(input.dosage);
  if (!dosage) return null;
  if (amountUnit(dosage) || isMassStrength(dosage) || /^\d+(?:\.\d+)?$/.test(dosage)) return null;
  return dosage;
}

function dosePhrase(input: PrescriptionDisplayInput): string | null {
  const dosage = clean(input.dosage);
  const form = clean(input.dosageForm);
  if (!dosage) return null;

  const parsed = amountUnit(dosage);
  if (parsed && isCountableDose(parsed, form)) {
    return countUnitPhrase(parsed.amount, parsed.unit) ?? dosage;
  }

  if (/^\d+(?:\.\d+)?$/.test(dosage) && form) {
    return countUnitPhrase(dosage, form) ?? dosage;
  }

  const strength = clean(input.strength);
  if ((isMassStrength(dosage) || strength) && isCountableForm(form)) {
    return countUnitPhrase("1", form as string) ?? dosage;
  }

  if (descriptiveDosage(input)) return null;
  return dosage;
}

function inferredRoute(form: string | null): string | null {
  if (!form) return null;
  const key = formKey(form);
  if (["tablet", "capsule", "pill", "caplet", "lozenge", "troche", "sachet", "syrup", "suspension", "solution", "emulsion", "elixir"].includes(key)) return "oral";
  if (["cream", "ointment", "gel", "lotion", "paste", "foam"].includes(key)) return "topical";
  if (["inhaler", "inhalation", "nebulizer"].includes(key)) return "inhalation";
  if (["suppository", "enema"].includes(key)) return "rectal";
  return null;
}

function durationPhrase(value: string | null | undefined): string | null {
  const duration = clean(value);
  if (!duration) return null;
  if (/^\d+$/.test(duration)) {
    return `${duration} ${Number(duration) === 1 ? "day" : "days"}`;
  }
  return duration;
}

function instructionSentence(value: string | null): string {
  const text = clean(value);
  if (!text) return "";
  const sentence = capitalizeFirst(text);
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

export function prescriptionHeading(input: PrescriptionDisplayInput): string {
  const medication = clean(input.medication) ?? "Prescription item";
  const pieces = [medication];

  const dosage = clean(input.dosage);
  const strength = clean(input.strength) ?? (isMassStrength(dosage) ? dosage : null);
  if (strength && !containsPhrase(pieces.join(" "), strength)) {
    pieces.push(strength);
  }

  const dosageForm = clean(input.dosageForm);
  if (dosageForm && !containsPhrase(pieces.join(" "), dosageForm)) {
    pieces.push(lowerFirst(dosageForm));
  }

  return pieces.join(" ");
}

export function prescriptionInstruction(input: PrescriptionDisplayInput): string | null {
  const form = clean(input.dosageForm);
  const route = clean(input.route)?.toLowerCase() ?? inferredRoute(form);
  const routePlan = route
    ? ROUTE_INSTRUCTIONS[route] ?? { verb: "Use", modifier: `by ${route}` }
    : { verb: "Use" };

  const dose = dosePhrase(input);
  const frequency = (() => {
    const raw = clean(input.frequency);
    if (raw?.toUpperCase() === "STAT") return "immediately";
    const label = prescriptionFrequencyLabel(input.frequency);
    return label ? lowerFirst(label) : null;
  })();
  const duration = durationPhrase(input.duration);

  const hasStructuredDirections = Boolean(dose || frequency || duration || route);
  const generated = hasStructuredDirections
    ? [
        routePlan.verb,
        dose,
        routePlan.modifier,
        frequency,
        duration ? `for ${duration}` : null,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  const additionalParts = [clean(input.instructions), descriptiveDosage(input)].filter(Boolean);
  const additional = additionalParts.join(" ").trim() || null;
  if (!generated && !additional) return null;
  if (!generated) return instructionSentence(additional);
  if (!additional) return `${generated}.`;

  const generatedSentence = `${generated}.`;
  return containsPhrase(generatedSentence, additional)
    ? generatedSentence
    : `${generatedSentence} ${instructionSentence(additional)}`;
}

export function formatPrescription(input: PrescriptionDisplayInput): PrescriptionDisplay {
  return {
    heading: prescriptionHeading(input),
    instruction: prescriptionInstruction(input),
  };
}
