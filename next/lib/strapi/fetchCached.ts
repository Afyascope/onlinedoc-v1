import { cache } from "react";
import fetchContentType from "./fetchContentType";

export const fetchCached = cache(
  async (
    contentType: string,
    params?: Record<string, unknown>,
    spreadData?: boolean
  ): Promise<any> => {
    return fetchContentType(contentType, params, spreadData);
  }
);
