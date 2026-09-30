/** Shared server-side role assertion for administrative actions. */
export function assertAdminRole(role: string | null | undefined): void {
  if (role !== "admin") throw new Error("Forbidden");
}
