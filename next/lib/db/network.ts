import net from "node:net";

/**
 * Neon hostnames resolve to both IPv4 and IPv6 addresses. On development
 * networks without IPv6 routing, Node's 250 ms happy-eyeballs attempt timeout
 * can abort the usable IPv4 attempt and surface an AggregateError/ETIMEDOUT
 * even though the database is reachable. Give the IPv4 attempt enough time to
 * complete before the IPv6 attempt is treated as a failure.
 */
export const DATABASE_AUTO_SELECT_FAMILY_ATTEMPT_TIMEOUT_MS = 1000;

export function configureDatabaseNetworking() {
  const setAttemptTimeout = (
    net as typeof net & {
      setDefaultAutoSelectFamilyAttemptTimeout?: (milliseconds: number) => void;
    }
  ).setDefaultAutoSelectFamilyAttemptTimeout;

  if (typeof setAttemptTimeout === "function") {
    setAttemptTimeout(DATABASE_AUTO_SELECT_FAMILY_ATTEMPT_TIMEOUT_MS);
  }

  return {
    autoSelectFamilyAttemptTimeoutMs:
      typeof setAttemptTimeout === "function"
        ? DATABASE_AUTO_SELECT_FAMILY_ATTEMPT_TIMEOUT_MS
        : null,
  };
}
