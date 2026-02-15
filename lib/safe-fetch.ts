/**
 * Safely parse JSON from a fetch Response.
 * If the response body is not valid JSON (e.g. HTML error page),
 * returns a fallback object with `{ error: "..." }` instead of throwing.
 */
export const safeJson = async <T = any>(
  res: Response
): Promise<T> => {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return { error: `Server returned non-JSON response (${res.status})` } as unknown as T;
  }
};
