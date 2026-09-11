import { pgTable, text, timestamp, boolean, integer, decimal, date, time, jsonb, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";

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
  medication: text("medication").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  instructions: text("instructions"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: text("status").notNull().default("active"),
  refillsRemaining: integer("refills_remaining").notNull().default(0),
  refillsTotal: integer("refills_total").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
  diagnosis: text("diagnosis"),
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
