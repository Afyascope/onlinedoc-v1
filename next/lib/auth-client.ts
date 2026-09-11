import { createAuthClient } from "better-auth/client";
import { siteUrl } from "@/lib/config";

export const authClient = createAuthClient({
  baseURL: siteUrl(),
});
