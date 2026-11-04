import { createAuthClient } from "better-auth/client";
import { appOrigin } from "@/lib/config";

export const authClient = createAuthClient({
  baseURL: appOrigin(),
});
