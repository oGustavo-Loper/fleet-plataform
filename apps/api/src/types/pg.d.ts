declare module "pg" {
  export type QueryResult<TRow = Record<string, unknown>> = {
    rows: TRow[];
  };

  export class PoolClient {
    query<TRow = Record<string, unknown>>(
      sql: string,
      params?: unknown[]
    ): Promise<QueryResult<TRow>>;
    release(): void;
  }

  export class Pool {
    constructor(options?: { connectionString?: string });
    connect(): Promise<PoolClient>;
    query<TRow = Record<string, unknown>>(
      sql: string,
      params?: unknown[]
    ): Promise<QueryResult<TRow>>;
    end(): Promise<void>;
  }
}
