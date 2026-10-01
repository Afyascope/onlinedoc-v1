const PUBLIC_REGISTRATION_ROLES = new Set(["patient", "clinician"]);

export function isPublicRegistrationRole(role) {
  return PUBLIC_REGISTRATION_ROLES.has(role);
}
