import { draftMode } from "next/headers";
import qs from "qs";

/**
 * Fetches data for a specified Strapi content type.
 *
 * @param {string} contentType - The type of content to fetch from Strapi.
 * @param {string} params - Query parameters to append to the API request.
 * @param {boolean} spreadData - If true, unwraps the response to return the first item (useful for single pages).
 * @return {Promise<any>} The fetched data.
 */

interface StrapiData {
  id: number;
  attributes: Record<string, any>; // Adjusted for standard Strapi v4/v5 structure
  [key: string]: any;
}

interface StrapiResponse {
  data: StrapiData | StrapiData[];
  meta?: any;
}

export function spreadStrapiData(data: StrapiResponse): StrapiData | null {
  if (Array.isArray(data.data) && data.data.length > 0) {
    return data.data[0];
  }
  if (!Array.isArray(data.data)) {
    return data.data;
  }
  return null;
}

export default async function fetchContentType(
  contentType: string,
  params: Record<string, unknown> = {},
  spreadData?: boolean,
): Promise<any> {
  // 1. Check if we are in "Draft Mode" (Next.js Preview)
  const { isEnabled } = await draftMode();

  try {
    const queryParams = { ...params };

    // 2. CRITICAL FIX: Use the correct Strapi param for previews
    if (isEnabled) {
      queryParams.publicationState = "preview";
    }

    // Construct the URL
    const url = new URL(`api/${contentType}`, process.env.NEXT_PUBLIC_API_URL);

    // 3. CRITICAL FIX: Add Authorization Header
    // You cannot view drafts without a token.
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (process.env.STRAPI_API_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.STRAPI_API_TOKEN}`;
    }

    // Perform the fetch
    const response = await fetch(`${url.href}?${qs.stringify(queryParams)}`, {
      method: "GET",
      headers: headers,
      // 4. Caching Strategy
      // 'no-store' ensures you always see fresh data in dev/preview.
      // For production speed, you might change this to { next: { revalidate: 60 } } later.
      cache: "no-store", 
    });

    if (!response.ok) {
      // Log the actual status text for easier debugging
      throw new Error(
        `Failed to fetch data from Strapi (url=${url.toString()}, status=${response.status} ${response.statusText})`
      );
    }

    const jsonData: StrapiResponse = await response.json();
    return spreadData ? spreadStrapiData(jsonData) : jsonData;

  } catch (error) {
    // Log error but return null so the page doesn't crash entirely (it will trigger 404 in page.tsx)
    console.error("FetchContentTypeError:", error);
    return null;
  }
}