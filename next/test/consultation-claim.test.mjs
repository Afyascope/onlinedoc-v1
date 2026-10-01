import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("verified payment leaves consultation paid and unassigned, and notifies approved clinicians", async () => {
  const completion = await source("lib/payments/complete-consultation.ts");
  assert.match(completion, /\.set\(\{ status: "paid", paymentChannel:[\s\S]*?paidAt:/);
  assert.doesNotMatch(completion, /\.set\(\{[^}]*clinicianId:/);
  assert.match(completion, /eq\(user\.role, "clinician"\), eq\(user\.clinicianStatus, "APPROVED"\)/);
  assert.match(completion, /type: "consultation_available"/);
});

test("clinician queue and dashboard count only paid, unassigned consultations with paidAt", async () => {
  const dashboard = await source("app/[locale]/(authenticated)/dashboard/clinician/data.ts");
  const queue = await source("app/[locale]/(authenticated)/dashboard/clinician/consultations/page.tsx");
  for (const code of [dashboard, queue]) {
    assert.match(code, /eq\(consultations\.status, "paid"\)/);
    assert.match(code, /isNull\(consultations\.clinicianId\)/);
    assert.match(code, /isNotNull\(consultations\.paidAt\)/);
  }
  assert.doesNotMatch(queue, /symptoms|medicalHistory|patientId/);
});

test("clinician claim is session-authorized and atomically records assignment history", async () => {
  const actions = await source("lib/actions/consultations.ts");
  const claim = actions.match(/export async function claimConsultation\([\s\S]*?\n}\n/)?.[0] ?? "";
  assert.match(claim, /auth\.api\.getSession/);
  assert.match(claim, /session\.user\.role !== "clinician"/);
  assert.match(claim, /getClinicianStatus\(session\.user\) !== "APPROVED"/);
  assert.match(claim, /db\.transaction\(async \(tx\)/);
  assert.match(claim, /eq\(consultations\.status, "paid"\)/);
  assert.match(claim, /isNull\(consultations\.clinicianId\)/);
  assert.match(claim, /isNotNull\(consultations\.paidAt\)/);
  assert.match(claim, /\.returning\(\{ id: consultations\.id \}\)/);
  assert.match(claim, /tx\.insert\(consultationStatusHistory\)/);
  assert.match(claim, /This consultation is no longer available/);
  assert.doesNotMatch(claim, /clinicianId:\s*string/);
});

test("admin assignment requires admin, approved clinician, and atomic paid/unassigned state", async () => {
  const actions = await source("lib/actions/admin.ts");
  const assign = actions.match(/export async function assignConsultationClinician\([\s\S]*?\n}\n/)?.[0] ?? "";
  assert.match(assign, /getAdminSession\(\)/);
  assert.match(assign, /eq\(user\.role, "clinician"\)/);
  assert.match(assign, /eq\(user\.clinicianStatus, "APPROVED"\)/);
  assert.match(assign, /eq\(consultations\.status, "paid"\)/);
  assert.match(assign, /isNull\(consultations\.clinicianId\)/);
  assert.match(assign, /isNotNull\(consultations\.paidAt\)/);
  assert.match(assign, /tx\.insert\(consultationStatusHistory\)/);
  assert.match(assign, /This consultation has already been assigned/);
});

test("admin UI offers assignment only for paid unassigned consultations", async () => {
  const client = await source("app/[locale]/(authenticated)/dashboard/admin/consultations/client.tsx");
  assert.match(client, /c\.status === "paid" && !c\.clinicianId && c\.paidAt/);
  assert.match(client, /assignConsultationClinician\(consultation\.id, clinicianId\)/);
  assert.match(client, /No unassigned paid consultations/);
});
