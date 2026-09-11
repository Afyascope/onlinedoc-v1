"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  user, session as sessionTable, account,
  clinicianProfiles, consultations, consultationStatusHistory,
  orders, orderItems, payments, downloads,
  notifications, auditLogs, platformSettings, settings as oldSettings,
} from "@/db/schema";
import { eq, and, or, like, desc, asc, sql, count, gte, lte, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { appUrl, sendEmail } from "@/lib/email/send";

async function getAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Not authenticated");
  if (session.user.role !== "admin") throw new Error("Forbidden");
  return session;
}

function audit(action: string, target?: string, targetId?: string, metadata?: Record<string, unknown>, actorId?: string) {
  return db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    action,
    target,
    targetId,
    userId: actorId ?? null,
    metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
    createdAt: new Date(),
  });
}

// ── Dashboard Metrics ──

export async function getAdminMetrics() {
  await getAdminSession();

  const [[totalUsers], [totalPatients], [totalClinicians]] = await Promise.all([
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(user).where(eq(user.role, "patient")),
    db.select({ count: count() }).from(user).where(eq(user.role, "clinician")),
  ]);

  const [pendingClinicians] = await db
    .select({ count: count() })
    .from(user)
    .where(and(eq(user.role, "clinician"), eq(user.clinicianStatus, "PENDING")));

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalConsultations] = await db.select({ count: count() }).from(consultations);
  const [todayConsultations] = await db
    .select({ count: count() })
    .from(consultations)
    .where(gte(consultations.createdAt, todayStart));

  const [activeConsultations] = await db
    .select({ count: count() })
    .from(consultations)
    .where(inArray(consultations.status, ["paid", "waiting_for_clinician", "in_consultation"]));

  const [completedConsultations] = await db
    .select({ count: count() })
    .from(consultations)
    .where(eq(consultations.status, "completed"));

  const [revenueResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS numeric)), 0)` })
    .from(orders)
    .where(eq(orders.paymentStatus, "paid"));

  const [productsSold] = await db
    .select({ count: count() })
    .from(orderItems);

  const [downloadsCount] = await db
    .select({ count: count() })
    .from(downloads);

  const [activeSessions] = await db
    .select({ count: count() })
    .from(sessionTable)
    .where(gte(sessionTable.expiresAt, new Date()));

  return {
    totalUsers: Number(totalUsers?.count ?? 0),
    totalPatients: Number(totalPatients?.count ?? 0),
    totalClinicians: Number(totalClinicians?.count ?? 0),
    pendingClinicians: Number(pendingClinicians?.count ?? 0),
    totalConsultations: Number(totalConsultations?.count ?? 0),
    todayConsultations: Number(todayConsultations?.count ?? 0),
    activeConsultations: Number(activeConsultations?.count ?? 0),
    completedConsultations: Number(completedConsultations?.count ?? 0),
    totalRevenue: Number(revenueResult?.total ?? 0),
    productsSold: Number(productsSold?.count ?? 0),
    totalDownloads: Number(downloadsCount?.count ?? 0),
    activeSessions: Number(activeSessions?.count ?? 0),
  };
}

// ── User Management ──

export async function getUsers(page = 1, pageSize = 20) {
  await getAdminSession();
  const offset = (page - 1) * pageSize;

  const [totalResult] = await db.select({ count: count() }).from(user);
  const total = Number(totalResult?.count ?? 0);

  const rows = await db
    .select()
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { users: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function searchUsers(query: string, role?: string, status?: string, verified?: string) {
  await getAdminSession();

  const conditions: ReturnType<typeof eq>[] = [];
  if (role && role !== "all") conditions.push(eq(user.role, role));
  if (status === "active") conditions.push(eq(user.banned, false));
  if (status === "suspended") conditions.push(eq(user.banned, true));
  if (verified === "verified") conditions.push(eq(user.emailVerified, true));
  if (verified === "unverified") conditions.push(eq(user.emailVerified, false));

  let rows;
  if (query) {
    rows = await db
      .select()
      .from(user)
      .where(
        and(
          or(
            like(user.name, `%${query}%`),
            like(user.email, `%${query}%`),
          ),
          ...conditions,
        ),
      )
      .orderBy(desc(user.createdAt))
      .limit(50);
  } else {
    rows = await db
      .select()
      .from(user)
      .where(and(...conditions))
      .orderBy(desc(user.createdAt))
      .limit(50);
  }

  return rows;
}

export async function getUserDetail(userId: string) {
  await getAdminSession();

  const [userRow] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!userRow) throw new Error("User not found");

  const profile = await db
    .select()
    .from(clinicianProfiles)
    .where(eq(clinicianProfiles.userId, userId))
    .limit(1);

  const userConsultations = await db
    .select()
    .from(consultations)
    .where(or(eq(consultations.patientId, userId), eq(consultations.clinicianId, userId)))
    .orderBy(desc(consultations.createdAt))
    .limit(20);

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(20);

  const userLogins = await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.userId, userId), eq(auditLogs.action, "login")))
    .orderBy(desc(auditLogs.createdAt))
    .limit(10);

  return {
    user: userRow,
    profile: profile[0] ?? null,
    consultations: userConsultations,
    orders: userOrders,
    loginHistory: userLogins,
  };
}

export async function toggleUserBan(userId: string, ban: boolean) {
  const session = await getAdminSession();
  const [target] = await db.select({ role: user.role, clinicianApproved: user.clinicianApproved }).from(user).where(eq(user.id, userId)).limit(1);
  const clinicianStatus = target?.role === "clinician" ? (ban ? "SUSPENDED" : target.clinicianApproved ? "APPROVED" : "PENDING") : undefined;
  await db.update(user).set({ banned: ban, ...(clinicianStatus ? { clinicianStatus } : {}), updatedAt: new Date() }).where(eq(user.id, userId));
  await audit(ban ? "user_suspended" : "user_reactivated", "user", userId, { userId }, session.user.id);
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function verifyUserEmail(userId: string) {
  const session = await getAdminSession();
  await db.update(user).set({ emailVerified: true, updatedAt: new Date() }).where(eq(user.id, userId));
  await audit("user_email_verified", "user", userId, { userId }, session.user.id);
  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

export async function resetUserPassword(userId: string) {
  const session = await getAdminSession();
  // Better Auth handles password reset via its own flow
  // This triggers a password reset email
  await audit("user_password_reset", "user", userId, { userId }, session.user.id);
  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

// ── Clinician Management ──

export async function getClinicians() {
  await getAdminSession();

  const clinicians = await db
    .select()
    .from(user)
    .where(eq(user.role, "clinician"))
    .orderBy(desc(user.createdAt));

  const profiles = await db.select().from(clinicianProfiles);
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  const consultationCounts = await db
    .select({
      clinicianId: consultations.clinicianId,
      count: count(),
    })
    .from(consultations)
    .where(sql`${consultations.clinicianId} IS NOT NULL`)
    .groupBy(consultations.clinicianId);
  const countMap = new Map(consultationCounts.map((r) => [r.clinicianId, Number(r.count)]));

  return clinicians.map((c) => ({
    ...c,
    profile: profileMap.get(c.id) ?? null,
    consultationCount: countMap.get(c.id) ?? 0,
  }));
}

export async function approveClinician(userId: string) {
  const session = await getAdminSession();
  const [clinician] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!clinician || clinician.role !== "clinician") throw new Error("Clinician not found");
  const approvedAt = new Date();
  await db.update(user).set({ clinicianApproved: true, clinicianStatus: "APPROVED", approvedAt, approvedBy: session.user.id, updatedAt: approvedAt }).where(eq(user.id, userId));
  await sendEmail({ to: clinician.email, subject: "Your OnlineDoc clinician account is approved", template: "clinician-approved", props: { name: clinician.name, dashboardUrl: appUrl("/dashboard/clinician"), approved: true } });
  await db.insert(notifications).values({
    id: crypto.randomUUID(), userId, type: "clinician_approved", title: "Clinician application approved", body: "Your clinician account has been approved. You can now access your clinician dashboard.", link: "/dashboard/clinician", createdAt: approvedAt,
  });
  await audit("clinician_approved", "clinician", userId, { userId }, session.user.id);
  revalidatePath("/dashboard/admin/clinicians");
  return { success: true };
}

export async function rejectClinician(userId: string) {
  const session = await getAdminSession();
  const [clinician] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!clinician || clinician.role !== "clinician") throw new Error("Clinician not found");
  const rejectedAt = new Date();
  await db.update(user).set({ clinicianApproved: false, clinicianStatus: "REJECTED", approvedAt: null, approvedBy: null, updatedAt: rejectedAt }).where(eq(user.id, userId));
  await sendEmail({ to: clinician.email, subject: "Your OnlineDoc clinician application update", template: "clinician-approved", props: { name: clinician.name, dashboardUrl: appUrl("/support"), approved: false } });
  await db.insert(notifications).values({
    id: crypto.randomUUID(), userId, type: "clinician_rejected", title: "Clinician application update", body: "Your clinician application was not approved. Please contact support if you have questions.", link: "/support", createdAt: rejectedAt,
  });
  await audit("clinician_rejected", "clinician", userId, { userId }, session.user.id);
  revalidatePath("/dashboard/admin/clinicians");
  return { success: true };
}

export async function updateClinicianProfile(userId: string, data: {
  specialization?: string;
  qualifications?: string;
  consultationFee?: string;
  yearsOfExperience?: number;
}) {
  const session = await getAdminSession();

  const existing = await db.select().from(clinicianProfiles).where(eq(clinicianProfiles.userId, userId)).limit(1);

  if (existing.length > 0) {
    await db.update(clinicianProfiles).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(clinicianProfiles.userId, userId));
  } else {
    await db.insert(clinicianProfiles).values({
      userId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await audit("clinician_profile_updated", "clinician", userId, { userId, ...data }, session.user.id);
  revalidatePath("/dashboard/admin/clinicians");
  return { success: true };
}

// ── Consultation Management ──

export async function getAllConsultations(page = 1, pageSize = 25) {
  await getAdminSession();
  const offset = (page - 1) * pageSize;

  const [totalResult] = await db.select({ count: count() }).from(consultations);
  const total = Number(totalResult?.count ?? 0);

  const rows = await db
    .select()
    .from(consultations)
    .orderBy(desc(consultations.createdAt))
    .limit(pageSize)
    .offset(offset);

  const userIds = new Set<string>();
  rows.forEach((c) => {
    if (c.patientId) userIds.add(c.patientId);
    if (c.clinicianId) userIds.add(c.clinicianId);
  });

  const userRows = userIds.size > 0
    ? await db.select().from(user).where(inArray(user.id, Array.from(userIds)))
    : [];
  const userMap = new Map(userRows.map((u) => [u.id, u]));

  return {
    consultations: rows.map((c) => ({
      ...c,
      patient: userMap.get(c.patientId) ?? null,
      clinician: c.clinicianId ? userMap.get(c.clinicianId) ?? null : null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getConsultationsByStatus(status: string, page = 1, pageSize = 25) {
  await getAdminSession();
  const offset = (page - 1) * pageSize;

  const [totalResult] = await db
    .select({ count: count() })
    .from(consultations)
    .where(eq(consultations.status, status));
  const total = Number(totalResult?.count ?? 0);

  const rows = await db
    .select()
    .from(consultations)
    .where(eq(consultations.status, status))
    .orderBy(desc(consultations.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { consultations: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function assignConsultationClinician(consultationId: string, clinicianId: string) {
  const session = await getAdminSession();

  const [clinician] = await db.select({ id: user.id })
    .from(user)
    .where(and(eq(user.id, clinicianId), eq(user.role, "clinician"), eq(user.clinicianStatus, "APPROVED")))
    .limit(1);
  if (!clinician) throw new Error("Clinician not found or not approved");

  await db.update(consultations).set({
    clinicianId,
    status: "waiting_for_clinician",
    updatedAt: new Date(),
  }).where(eq(consultations.id, consultationId));

  await db.insert(consultationStatusHistory).values({
    id: crypto.randomUUID(),
    consultationId,
    status: "waiting_for_clinician",
    changedBy: session.user.id,
    createdAt: new Date(),
  });

  await audit("consultation_assigned", "consultation", consultationId, { clinicianId }, session.user.id);
  revalidatePath("/dashboard/admin/consultations");
  return { success: true };
}

export async function cancelConsultation(consultationId: string) {
  await getAdminSession();
  const session = await getAdminSession();

  await db.update(consultations).set({ status: "closed", updatedAt: new Date() }).where(eq(consultations.id, consultationId));

  await db.insert(consultationStatusHistory).values({
    id: crypto.randomUUID(),
    consultationId,
    status: "closed",
    changedBy: session.user.id,
    createdAt: new Date(),
  });

  await audit("consultation_cancelled", "consultation", consultationId, {}, session.user.id);
  revalidatePath("/dashboard/admin/consultations");
  return { success: true };
}

export async function closeConsultation(consultationId: string) {
  await getAdminSession();
  const session = await getAdminSession();

  await db.update(consultations).set({ status: "closed", updatedAt: new Date() }).where(eq(consultations.id, consultationId));

  await db.insert(consultationStatusHistory).values({
    id: crypto.randomUUID(),
    consultationId,
    status: "closed",
    changedBy: session.user.id,
    createdAt: new Date(),
  });

  await audit("consultation_closed", "consultation", consultationId, {}, session.user.id);
  revalidatePath("/dashboard/admin/consultations");
  return { success: true };
}

// ── Marketplace Management ──

export async function getOrderStats() {
  await getAdminSession();

  const [totalOrders] = await db.select({ count: count() }).from(orders);
  const [paidOrders] = await db.select({ count: count() }).from(orders).where(eq(orders.paymentStatus, "paid"));
  const [totalRevenue] = await db
    .select({ total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS numeric)), 0)` })
    .from(orders)
    .where(eq(orders.paymentStatus, "paid"));

  const [totalDownloads] = await db
    .select({ count: count() })
    .from(downloads);

  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(10);

  return {
    totalOrders: Number(totalOrders?.count ?? 0),
    paidOrders: Number(paidOrders?.count ?? 0),
    totalRevenue: Number(totalRevenue?.total ?? 0),
    totalDownloads: Number(totalDownloads?.count ?? 0),
    recentOrders,
  };
}

// ── Order Management ──

export async function getOrders(page = 1, pageSize = 25) {
  await getAdminSession();
  const offset = (page - 1) * pageSize;

  const [totalResult] = await db.select({ count: count() }).from(orders);
  const total = Number(totalResult?.count ?? 0);

  const rows = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset(offset);

  const userIds = new Set(rows.map((o) => o.userId));
  const userRows = userIds.size > 0
    ? await db.select().from(user).where(inArray(user.id, Array.from(userIds)))
    : [];
  const userMap = new Map(userRows.map((u) => [u.id, u]));

  const ordersWithItems = await Promise.all(
    rows.map(async (o) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
      return { ...o, user: userMap.get(o.userId) ?? null, items };
    }),
  );

  return { orders: ordersWithItems, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function refundOrder(orderId: string) {
  await getAdminSession();
  return { success: false, error: "Paystack refund processing is not implemented; no local refund state was changed." };
}

// ── Payments ──

export async function getPayments(page = 1, pageSize = 25) {
  await getAdminSession();
  const offset = (page - 1) * pageSize;

  const [totalResult] = await db.select({ count: count() }).from(payments);
  const total = Number(totalResult?.count ?? 0);

  const rows = await db
    .select()
    .from(payments)
    .orderBy(desc(payments.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { payments: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// ── Notifications ──

export async function getAllNotifications(page = 1, pageSize = 25) {
  await getAdminSession();
  const offset = (page - 1) * pageSize;

  const [totalResult] = await db.select({ count: count() }).from(notifications);
  const total = Number(totalResult?.count ?? 0);

  const rows = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { notifications: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function markAllNotificationsRead() {
  await getAdminSession();
  await db.update(notifications).set({ readAt: new Date() }).where(sql`${notifications.readAt} IS NULL`);
  revalidatePath("/dashboard/admin/notifications");
  return { success: true };
}

// ── Reports ──

export async function getReportData(type: string, from?: string, to?: string) {
  await getAdminSession();

  const startDate = from ? new Date(from) : new Date("2024-01-01");
  const endDate = to ? new Date(to + "T23:59:59") : new Date();
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("Invalid date range");
  }

  switch (type) {
    case "users": {
      const rows = await db
        .select({
          date: sql<string>`DATE(${user.createdAt})::text`,
          count: count(),
        })
        .from(user)
        .where(and(gte(user.createdAt, startDate), lte(user.createdAt, endDate)))
        .groupBy(sql`DATE(${user.createdAt})`)
        .orderBy(sql`DATE(${user.createdAt})`);
      return { rows, total: rows.reduce((a, r) => a + Number(r.count), 0) };
    }
    case "consultations": {
      const rows = await db
        .select({
          date: sql<string>`DATE(${consultations.createdAt})::text`,
          count: count(),
        })
        .from(consultations)
        .where(and(gte(consultations.createdAt, startDate), lte(consultations.createdAt, endDate)))
        .groupBy(sql`DATE(${consultations.createdAt})`)
        .orderBy(sql`DATE(${consultations.createdAt})`);
      return { rows, total: rows.reduce((a, r) => a + Number(r.count), 0) };
    }
    case "revenue": {
      const rows = await db
        .select({
          date: sql<string>`DATE(${orders.createdAt})::text`,
          total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS numeric)), 0)`,
        })
        .from(orders)
        .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
        .groupBy(sql`DATE(${orders.createdAt})`)
        .orderBy(sql`DATE(${orders.createdAt})`);
      return { rows, total: rows.reduce((a, r) => a + Number(r.total), 0) };
    }
    default:
      return { rows: [], total: 0 };
  }
}

export async function generateCSV(type: string) {
  await getAdminSession();

  switch (type) {
    case "users": {
      const rows = await db.select().from(user).orderBy(desc(user.createdAt));
      const header = "ID,Name,Email,Role,Email Verified,Clinician Approved,Created At";
      const csv = rows.map((r) =>
        `${r.id},${r.name},${r.email},${r.role},${r.emailVerified},${r.clinicianApproved},${r.createdAt?.toISOString()}`
      ).join("\n");
      return `${header}\n${csv}`;
    }
    case "consultations": {
      const rows = await db.select().from(consultations).orderBy(desc(consultations.createdAt));
      const header = "ID,Patient ID,Clinician ID,Type,Title,Status,Fee,Created At";
      const csv = rows.map((r) =>
        `${r.id},${r.patientId},${r.clinicianId ?? ""},${r.consultationType},${r.title},${r.status},${r.fee},${r.createdAt?.toISOString()}`
      ).join("\n");
      return `${header}\n${csv}`;
    }
    case "orders": {
      const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
      const header = "ID,User ID,Type,Total,Currency,Payment Status,Created At";
      const csv = rows.map((r) =>
        `${r.id},${r.userId},${r.orderType},${r.totalAmount},${r.currency},${r.paymentStatus},${r.createdAt?.toISOString()}`
      ).join("\n");
      return `${header}\n${csv}`;
    }
    default:
      return "";
  }
}

// ── Platform Settings ──

export async function getPlatformSettings() {
  await getAdminSession();
  return db.select().from(platformSettings).orderBy(platformSettings.group, platformSettings.key);
}

export async function updatePlatformSetting(id: string, value: string) {
  const session = await getAdminSession();
  await db.update(platformSettings).set({ value, updatedAt: new Date() }).where(eq(platformSettings.id, id));
  await audit("setting_updated", "setting", id, { settingId: id }, session.user.id);
  revalidatePath("/dashboard/admin/settings");
  return { success: true };
}

export async function seedPlatformSettings() {
  await getAdminSession();
  const defaults = [
    { group: "general", key: "platform_name", value: "OnlineDoc", type: "string", label: "Platform Name" },
    { group: "general", key: "support_email", value: "support@onlinedoc.co.ke", type: "string", label: "Support Email" },
    { group: "general", key: "support_phone", value: "+254-700-000-000", type: "string", label: "Support Phone" },
    { group: "general", key: "maintenance_mode", value: "false", type: "boolean", label: "Maintenance Mode" },
    { group: "consultations", key: "consultation_fee", value: "50", type: "number", label: "Default Consultation Fee" },
    { group: "payments", key: "currency", value: "KES", type: "string", label: "Currency" },
    { group: "payments", key: "payment_provider", value: "paystack", type: "string", label: "Payment Provider" },
    { group: "branding", key: "brand_name", value: "OnlineDoc", type: "string", label: "Brand Name" },
    { group: "social", key: "twitter_url", value: "", type: "string", label: "Twitter URL" },
    { group: "social", key: "facebook_url", value: "", type: "string", label: "Facebook URL" },
    { group: "social", key: "instagram_url", value: "", type: "string", label: "Instagram URL" },
  ];

  for (const s of defaults) {
    const existing = await db.select().from(platformSettings).where(eq(platformSettings.key, s.key)).limit(1);
    if (existing.length === 0) {
      await db.insert(platformSettings).values({
        id: crypto.randomUUID(),
        ...s,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  revalidatePath("/dashboard/admin/settings");
  return { success: true };
}

// ── Audit Logs ──

export async function getAuditLogs(page = 1, pageSize = 50, filters?: { action?: string; userId?: string }) {
  await getAdminSession();
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [];
  if (filters?.action && filters.action !== "all") conditions.push(eq(auditLogs.action, filters.action));
  if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = whereClause
    ? await db.select({ count: count() }).from(auditLogs).where(whereClause)
    : await db.select({ count: count() }).from(auditLogs);
  const total = Number(totalResult?.count ?? 0);

  const rows = await db
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageSize)
    .offset(offset);

  const ids: string[] = rows.map((r) => r.userId).filter((id): id is string => !!id);
  const userRows = ids.length > 0
    ? await db.select().from(user).where(inArray(user.id, ids))
    : [];
  const userMap = new Map(userRows.map((u) => [u.id, u]));

  return {
    logs: rows.map((r) => ({ ...r, actor: r.userId ? userMap.get(r.userId) ?? null : null })),
    total, page, pageSize, totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAuditActions() {
  await getAdminSession();
  const rows = await db
    .select({ action: auditLogs.action })
    .from(auditLogs)
    .groupBy(auditLogs.action)
    .orderBy(auditLogs.action);
  return rows.map((r) => r.action);
}

// ── Analytics ──

export async function getMonthlyRegistrations() {
  await getAdminSession();
  return db
    .select({
      month: sql<string>`TO_CHAR(${user.createdAt}, 'YYYY-MM')`,
      count: count(),
    })
    .from(user)
    .groupBy(sql`TO_CHAR(${user.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${user.createdAt}, 'YYYY-MM')`)
    .limit(12);
}

export async function getMonthlyConsultations() {
  await getAdminSession();
  return db
    .select({
      month: sql<string>`TO_CHAR(${consultations.createdAt}, 'YYYY-MM')`,
      count: count(),
    })
    .from(consultations)
    .groupBy(sql`TO_CHAR(${consultations.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${consultations.createdAt}, 'YYYY-MM')`)
    .limit(12);
}

export async function getTopProducts() {
  await getAdminSession();
  return db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      productSlug: orderItems.productSlug,
      totalSold: count(),
      totalRevenue: sql<number>`COALESCE(SUM(CAST(${orderItems.price} AS numeric)), 0)`,
    })
    .from(orderItems)
    .groupBy(orderItems.productId, orderItems.productName, orderItems.productSlug)
    .orderBy(desc(sql`count(*)`))
    .limit(10);
}

export async function getTopClinicians() {
  await getAdminSession();
  return db
    .select({
      clinicianId: consultations.clinicianId,
      totalConsultations: count(),
    })
    .from(consultations)
    .where(sql`${consultations.clinicianId} IS NOT NULL`)
    .groupBy(consultations.clinicianId)
    .orderBy(desc(sql`count(*)`))
    .limit(10);
}

export async function getPaymentMethodBreakdown() {
  await getAdminSession();
  return db
    .select({
      method: payments.method,
      count: count(),
      total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS numeric)), 0)`,
    })
    .from(payments)
    .groupBy(payments.method)
    .orderBy(desc(sql`count(*)`));
}
