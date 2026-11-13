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

export type DoubleOptions = {
  user?: { id: string; email?: string; app_metadata?: Record<string, unknown> } | null;
  rpcResults?: DoubleResult | DoubleResult[];
  authResults?: {
    signInWithPassword?: DoubleResult;
    signUp?: { data: { user?: unknown; session?: unknown }; error: { message: string } | null };
    signInWithOAuth?: { data: { url?: string | null }; error: { message: string } | null };
    resetPasswordForEmail?: DoubleResult;
  };
};

const CHAIN_METHODS = [
  "select",
  "insert",
  "update",
  "upsert",
  "delete",
  "eq",
  "neq",
  "in",
  "ilike",
  "is",
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

export function createSupabaseDouble(
  results: DoubleResult | DoubleResult[],
  options?: DoubleOptions,
) {
  const calls: DoubleCall[] = [];
  const queue = Array.isArray(results) ? [...results] : null;
  const single = Array.isArray(results) ? null : results;
  const rpcQueue = Array.isArray(options?.rpcResults) ? [...options.rpcResults] : null;
  const rpcSingle = Array.isArray(options?.rpcResults) ? null : options?.rpcResults;

  function nextResult(): DoubleResult {
    if (queue) return queue.shift() ?? { data: [], error: null };
    return single ?? { data: null, error: null };
  }

  function nextRpcResult(): DoubleResult {
    if (rpcQueue) return rpcQueue.shift() ?? { data: null, error: null };
    return rpcSingle ?? { data: null, error: null };
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
    rpc(fn: string, params?: unknown) {
      calls.push({ method: "rpc", args: params !== undefined ? [fn, params] : [fn], table: "rpc" });
      return Promise.resolve(nextRpcResult());
    },
    auth: {
      async getUser() {
        calls.push({ method: "auth.getUser", args: [], table: "auth" });
        return { data: { user: options?.user ?? null }, error: null };
      },
      async signInWithPassword(creds: unknown) {
        calls.push({ method: "auth.signInWithPassword", args: [creds], table: "auth" });
        return options?.authResults?.signInWithPassword ?? { data: null, error: null };
      },
      async signUp(payload: unknown) {
        calls.push({ method: "auth.signUp", args: [payload], table: "auth" });
        return options?.authResults?.signUp ?? { data: { user: null, session: null }, error: null };
      },
      async signInWithOAuth(payload: unknown) {
        calls.push({ method: "auth.signInWithOAuth", args: [payload], table: "auth" });
        return options?.authResults?.signInWithOAuth ?? { data: { url: null }, error: null };
      },
      async resetPasswordForEmail(email: string, opts?: unknown) {
        calls.push({
          method: "auth.resetPasswordForEmail",
          args: opts !== undefined ? [email, opts] : [email],
          table: "auth",
        });
        return options?.authResults?.resetPasswordForEmail ?? { data: null, error: null };
      },
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
