/**
 * Test double untuk client Supabase server.
 *
 * Merekam seluruh rantai pemanggilan query (`from`, `select`, `eq`, …) dan
 * mengembalikan hasil yang bisa dikonfigurasi: satu objek untuk semua query,
 * atau antrean hasil yang dikonsumsi berurutan setiap `await` (untuk service
 * yang menjalankan lebih dari satu query, mis. lookup kategori lalu artikel).
 */

export type DoubleResult = {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
};

export type DoubleCall = { method: string; args: unknown[]; table: string };

const CHAIN_METHODS = [
  "select",
  "eq",
  "neq",
  "or",
  "gte",
  "gt",
  "lt",
  "lte",
  "order",
  "limit",
  "range",
  "single",
  "maybeSingle",
] as const;

export function createSupabaseDouble(results: DoubleResult | DoubleResult[]) {
  const calls: DoubleCall[] = [];
  const queue = Array.isArray(results) ? [...results] : null;
  const single = Array.isArray(results) ? null : results;

  function nextResult(): DoubleResult {
    if (queue) return queue.shift() ?? { data: [], error: null };
    return single ?? { data: null, error: null };
  }

  function makeBuilder(table: string): Record<string, unknown> {
    const builder: Record<string, unknown> = {};
    for (const method of CHAIN_METHODS) {
      builder[method] = (...args: unknown[]) => {
        calls.push({ method, args, table });
        return builder;
      };
    }
    // Thenable: membuat `await supabase.from(...).select(...)…` menerima hasil.
    builder.then = (
      onFulfilled: (r: DoubleResult) => unknown,
      onRejected?: (e: unknown) => unknown,
    ) => Promise.resolve(nextResult()).then(onFulfilled, onRejected);
    return builder;
  }

  const client = {
    from(table: string) {
      calls.push({ method: "from", args: [table], table });
      return makeBuilder(table);
    },
  };

  return { client, calls };
}

export type SupabaseDouble = ReturnType<typeof createSupabaseDouble>;

/** Assertion helper: apakah ada pemanggilan method dengan argumen persis? */
export function hasCall(calls: DoubleCall[], method: string, ...args: unknown[]): boolean {
  return calls.some(
    (c) =>
      c.method === method &&
      c.args.length === args.length &&
      c.args.every((a, i) => a === args[i]),
  );
}
