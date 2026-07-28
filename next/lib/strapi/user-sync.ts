import fetchContentType from "./fetchContentType";

interface SyncUserInput {
  betterAuthId: string;
  email: string;
  name: string;
  role: string;
}

export async function syncUserToStrapi(userData: SyncUserInput): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/local/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: userData.email,
          email: userData.email,
          password: crypto.randomUUID(),
          name: userData.name,
          betterAuthId: userData.betterAuthId,
          role: userData.role,
        }),
      }
    );

    if (!response.ok) {
      console.warn("Strapi sync returned non-ok:", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to sync user to Strapi:", error);
    return false;
  }
}

export async function getStrapiUserByBetterAuthId(betterAuthId: string) {
  try {
    const users = await fetchContentType("users", {
      filters: { betterAuthId },
    });
    return users?.data?.[0] || null;
  } catch {
    return null;
  }
}