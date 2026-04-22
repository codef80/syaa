/**
 * TanStack Start's useServerFn may wrap handler results in `{ result }` depending
 * on the build mode. This helper normalizes the response so callers always get
 * the actual handler return value.
 */
export function unwrapServerFn<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "result" in (raw as Record<string, unknown>)) {
    return (raw as { result: T }).result;
  }
  return raw as T;
}

export interface GenerateResult {
  success: boolean;
  output: string;
  id?: string;
  pointsUsed: number;
  model?: string;
}
