import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, integer, decimal, date, time, jsonb, uniqueIndex, index, type AnyPgColumn } from "drizzle-orm/pg-core";

// ── Better Auth tables ──

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  role: text("role").notNull().default("patient"),
  clinicianApproved: boolean("clinician_approved").notNull().default(false),
  clinicianStatus: text("clinician_status").notNull().default("PENDING"),
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by").references((): AnyPgColumn => user.id),
  banned: boolean("banned").notNull().default(false),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// ── App tables ──

export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  clinicianId: text("clinician_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  time: time("time"),
  duration: integer("duration"),
  type: text("type").notNull().default("in_person"),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const medicalRecords = pgTable("medical_records", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  clinicianId: text("clinician_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("visit"),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"),
  recordDate: date("record_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const prescriptions = pgTable("prescriptions", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  clinicianId: text("clinician_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  // `medication` is the immutable catalogue display-name snapshot for items
  // created through the medication catalogue. Legacy free-text rows continue
  // to use it as their medication name.
  medication: text("medication").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  instructions: text("instructions"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: text("status").notNull().default("active"),
  refillsRemaining: integer("refills_remaining").notNull().default(0),
  refillsTotal: integer("refills_total").notNull().default(0),
  consultationId: text("consultation_id").references(() => consultations.id),
  catalogueResourceId: text("catalogue_resource_id").references(() => catalogueResources.id),
  catalogueReleaseId: text("catalogue_release_id").references(() => catalogueReleases.id),
  genericNameSnapshot: text("generic_name_snapshot"),
  brandNameSnapshot: text("brand_name_snapshot"),
  strengthSnapshot: text("strength_snapshot"),
  dosageFormSnapshot: text("dosage_form_snapshot"),
  routeSnapshot: text("route_snapshot"),
  sourceSnapshot: text("source_snapshot"),
  sourceIdentifierSnapshot: text("source_identifier_snapshot"),
  releaseVersionSnapshot: text("release_version_snapshot"),
  dosageForm: text("dosage_form"),
  duration: text("duration"),
  route: text("route"),
  sortOrder: integer("sort_order").notNull().default(0),
  selectedBy: text("selected_by").references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("prescriptions_consultation_id_idx").on(table.consultationId),
  index("prescriptions_catalogue_resource_id_idx").on(table.catalogueResourceId),
]);

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  appointmentId: text("appointment_id").references(() => appointments.id),
  consultationId: text("consultation_id").references(() => consultations.id),
  orderId: text("order_id").references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("KES"),
  status: text("status").notNull().default("pending"),
  method: text("method"),
  channel: text("channel"),
  description: text("description"),
  invoiceNumber: text("invoice_number"),
  transactionReference: text("transaction_reference"),
  paystackReference: text("paystack_reference"),
  providerResponse: jsonb("provider_response"),
  receiptUrl: text("receipt_url"),
  dueDate: date("due_date"),
  paidAt: timestamp("paid_at"),
  failedAt: timestamp("failed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("payments_paystack_reference_unique").on(table.paystackReference),
]);

// ── Phase 8: Consultations ──

export const consultations = pgTable("consultations", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  clinicianId: text("clinician_id").references(() => user.id),
  consultationType: text("consultation_type").notNull().default("general"),
  title: text("title").notNull(),
  symptoms: text("symptoms"),
  durationOfIllness: text("duration_of_illness"),
  medicalHistory: text("medical_history"),
  status: text("status").notNull().default("draft"),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull().default("0"),
  stripeSessionId: text("stripe_session_id"),
  paystackReference: text("paystack_reference"),
  paymentChannel: text("payment_channel"),
  paidAt: timestamp("paid_at"),
  completedAt: timestamp("completed_at"),
  communicationChannel: text("communication_channel").notNull().default("whatsapp"),
  communicationLink: text("communication_link"),
  followUpDate: date("follow_up_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const consultationStatusHistory = pgTable("consultation_status_history", {
  id: text("id").primaryKey(),
  consultationId: text("consultation_id").notNull().references(() => consultations.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  changedBy: text("changed_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const consultationNotes = pgTable("consultation_notes", {
  id: text("id").primaryKey(),
  consultationId: text("consultation_id").notNull().references(() => consultations.id, { onDelete: "cascade" }),
  clinicianId: text("clinician_id").notNull().references(() => user.id),
  // The clinician's history notes are the single source of the Clinical
  // Summary used in request and consultation documents.
  historyNotes: text("history_notes"),
  diagnosis: text("diagnosis"),
  // Retained for backward compatibility only. New consultations use the
  // structured diagnosis/request/prescription tables.
  treatment: text("treatment"),
  prescription: text("prescription"),
  advice: text("advice"),
  followUpDate: date("follow_up_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const consultationFiles = pgTable("consultation_files", {
  id: text("id").primaryKey(),
  consultationId: text("consultation_id").notNull().references(() => consultations.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  uploadedBy: text("uploaded_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clinicianProfiles = pgTable("clinician_profiles", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  specialization: text("specialization"),
  qualifications: text("qualifications"),
  bio: text("bio"),
  yearsOfExperience: integer("years_of_experience"),
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("KES"),
  isAcceptingPatients: boolean("is_accepting_patients").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  type: text("type").notNull().default("string"),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Phase 9: Digital Health Marketplace (transactional only) ──

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  orderType: text("order_type").notNull().default("digital_product"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("KES"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paymentProvider: text("payment_provider"),
  paymentReference: text("payment_reference"),
  paystackReference: text("paystack_reference"),
  paymentChannel: text("payment_channel"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("orders_payment_reference_unique").on(table.paymentReference),
  uniqueIndex("orders_paystack_reference_unique").on(table.paystackReference),
]);

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  productName: text("product_name"),
  productSlug: text("product_slug"),
  quantity: integer("quantity").notNull().default(1),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const downloads = pgTable("downloads", {
  id: text("id").primaryKey(),
  orderItemId: text("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  downloadCount: integer("download_count").notNull().default(0),
  lastDownloadedAt: timestamp("last_downloaded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("downloads_order_item_id_unique").on(table.orderItemId),
]);

// ── Phase 10: Platform Administration ──

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id),
  action: text("action").notNull(),
  target: text("target"),
  targetId: text("target_id"),
  metadata: jsonb("metadata"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey(),
  group: text("group").notNull().default("general"),
  key: text("key").notNull().unique(),
  value: text("value").notNull().default(""),
  type: text("type").notNull().default("string"),
  label: text("label"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Clinical resource catalogues (PostgreSQL is the runtime source of truth) ──

export const catalogueReleases = pgTable("catalogue_releases", {
  id: text("id").primaryKey(),
  domain: text("domain").notNull(),
  fileName: text("file_name").notNull(),
  fileChecksum: text("file_checksum").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  fileType: text("file_type"),
  sourceName: text("source_name"),
  sourceIdentifier: text("source_identifier"),
  sourceVersion: text("source_version"),
  sourceUrl: text("source_url"),
  status: text("status").notNull().default("draft"),
  rowCount: integer("row_count").notNull().default(0),
  validRowCount: integer("valid_row_count").notNull().default(0),
  invalidRowCount: integer("invalid_row_count").notNull().default(0),
  newCount: integer("new_count").notNull().default(0),
  updatedCount: integer("updated_count").notNull().default(0),
  unchangedCount: integer("unchanged_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  warningCount: integer("warning_count").notNull().default(0),
  validationResult: jsonb("validation_result"),
  rows: jsonb("rows"),
  transformationNotes: text("transformation_notes"),
  notes: text("notes"),
  importedBy: text("imported_by").notNull().references(() => user.id),
  approvedBy: text("approved_by").references(() => user.id),
  activatedBy: text("activated_by").references(() => user.id),
  validatedAt: timestamp("validated_at"),
  approvedAt: timestamp("approved_at"),
  activatedAt: timestamp("activated_at"),
  retiredAt: timestamp("retired_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("catalogue_releases_domain_status_idx").on(table.domain, table.status),
  index("catalogue_releases_domain_checksum_idx").on(table.domain, table.fileChecksum),
  uniqueIndex("catalogue_releases_one_active_per_domain").on(table.domain).where(sql`"status" = 'active'`),
]);

export const catalogueResources = pgTable("catalogue_resources", {
  id: text("id").primaryKey(),
  releaseId: text("release_id").notNull().references(() => catalogueReleases.id),
  domain: text("domain").notNull(),
  stableIdentifier: text("stable_identifier").notNull(),
  code: text("code"),
  name: text("name").notNull(),
  description: text("description"),
  codingSystem: text("coding_system"),
  codingSystemVersion: text("coding_system_version"),
  synonyms: text("synonyms"),
  category: text("category"),
  specimen: text("specimen"),
  modality: text("modality"),
  genericName: text("generic_name"),
  brandName: text("brand_name"),
  activeIngredient: text("active_ingredient"),
  strength: text("strength"),
  dosageForm: text("dosage_form"),
  route: text("route"),
  source: text("source"),
  sourceIdentifier: text("source_identifier"),
  sourceVersion: text("source_version"),
  sourceUrl: text("source_url"),
  provenanceNotes: text("provenance_notes"),
  notes: text("notes"),
  lifecycle: text("lifecycle").notNull().default("imported"),
  isActive: boolean("is_active").notNull().default(true),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("catalogue_resources_release_domain_identifier_unique").on(table.releaseId, table.domain, table.stableIdentifier),
  index("catalogue_resources_domain_lifecycle_idx").on(table.domain, table.lifecycle),
  index("catalogue_resources_release_domain_idx").on(table.releaseId, table.domain),
  index("catalogue_resources_source_identifier_idx").on(table.source, table.sourceIdentifier),
]);

export const catalogueResourceHistory = pgTable("catalogue_resource_history", {
  id: text("id").primaryKey(),
  resourceId: text("resource_id").notNull().references(() => catalogueResources.id),
  releaseId: text("release_id").notNull().references(() => catalogueReleases.id),
  action: text("action").notNull(),
  actorId: text("actor_id").references(() => user.id),
  before: jsonb("before"),
  after: jsonb("after"),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("catalogue_resource_history_resource_idx").on(table.resourceId),
]);

// ── Structured consultation selections (immutable snapshots) ──

export const consultationDiagnoses = pgTable("consultation_diagnoses", {
  id: text("id").primaryKey(),
  consultationId: text("consultation_id").notNull().references(() => consultations.id, { onDelete: "cascade" }),
  resourceId: text("resource_id").notNull().references(() => catalogueResources.id),
  releaseId: text("release_id").notNull().references(() => catalogueReleases.id),
  codeSnapshot: text("code_snapshot"),
  nameSnapshot: text("name_snapshot").notNull(),
  codingSystemSnapshot: text("coding_system_snapshot"),
  codingSystemVersionSnapshot: text("coding_system_version_snapshot"),
  sourceSnapshot: text("source_snapshot"),
  sourceIdentifierSnapshot: text("source_identifier_snapshot"),
  releaseVersionSnapshot: text("release_version_snapshot"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  selectedBy: text("selected_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("consultation_diagnoses_consultation_idx").on(table.consultationId),
  index("consultation_diagnoses_resource_idx").on(table.resourceId),
]);

export const consultationRequests = pgTable("consultation_requests", {
  id: text("id").primaryKey(),
  consultationId: text("consultation_id").notNull().references(() => consultations.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  resourceId: text("resource_id").notNull().references(() => catalogueResources.id),
  releaseId: text("release_id").notNull().references(() => catalogueReleases.id),
  codeSnapshot: text("code_snapshot"),
  nameSnapshot: text("name_snapshot").notNull(),
  categorySnapshot: text("category_snapshot"),
  modalitySnapshot: text("modality_snapshot"),
  sourceSnapshot: text("source_snapshot"),
  sourceIdentifierSnapshot: text("source_identifier_snapshot"),
  releaseVersionSnapshot: text("release_version_snapshot"),
  notes: text("notes"),
  status: text("status").notNull().default("requested"),
  sortOrder: integer("sort_order").notNull().default(0),
  requestedBy: text("requested_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("consultation_requests_consultation_domain_idx").on(table.consultationId, table.domain),
  index("consultation_requests_resource_idx").on(table.resourceId),
]);

export const consultationDocuments = pgTable("consultation_documents", {
  id: text("id").primaryKey(),
  consultationId: text("consultation_id").notNull().references(() => consultations.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(),
  generatedBy: text("generated_by").notNull().references(() => user.id),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  checksum: text("checksum"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("consultation_documents_consultation_type_idx").on(table.consultationId, table.documentType),
]);
