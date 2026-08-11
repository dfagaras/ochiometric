declare module "cloudflare:workers" {
  type Statement = {
    bind(...values: unknown[]): Statement;
    first<T>(): Promise<T | null>;
    all<T>(): Promise<{ results: T[] }>;
    run(): Promise<{ meta?: { changes?: number } }>;
  };

  export const env: {
    DB: {
      prepare(sql: string): Statement;
    };
  };
}
