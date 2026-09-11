export type UserRole = "patient" | "clinician" | "admin";
export type ClinicianStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  clinicianApproved: boolean;
  clinicianStatus: ClinicianStatus;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: AuthUser;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  };
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}
