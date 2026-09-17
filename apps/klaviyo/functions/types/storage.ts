// Local stand-in for PIC-1321's Function-facing storage contract. Mirrors the
// RFC's `FunctionStorage` interface and DSL exactly so this code can be
// dropped in unchanged once `@contentful/node-apps-toolkit` ships the real
// types and the RPC worker actually injects `context.storage` — delete this
// file and switch the imports below to the toolkit at that point.

export type StorageColumnValue = string | number | boolean | null;

export interface StorageQueryFilter {
  column: string;
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'isNull';
  value?: StorageColumnValue | StorageColumnValue[];
}

export interface StorageAggregateSelect {
  fn: 'count' | 'sum' | 'avg' | 'min' | 'max';
  column: string;
  as: string;
}

export interface StorageJoin {
  table: string;
  on: { left: string; right: string };
  type?: 'inner' | 'left';
}

export interface StorageOrderBy {
  column: string;
  dir?: 'asc' | 'desc';
}

export interface StorageQuery {
  from: string;
  select?: (string | StorageAggregateSelect)[];
  where?: StorageQueryFilter[];
  join?: StorageJoin[];
  groupBy?: string[];
  orderBy?: StorageOrderBy[];
  limit?: number;
  offset?: number;
}

export interface StorageQueryResult<Row = Record<string, unknown>> {
  rows: Row[];
}

export interface StorageInsert {
  into: string;
  rows: Record<string, unknown>[];
}

export interface StorageUpdate {
  table: string;
  set: Record<string, unknown>;
  where: StorageQueryFilter[];
}

export interface StorageDelete {
  table: string;
  where: StorageQueryFilter[];
}

export interface StorageWriteResult {
  affectedRows: number;
}

export interface FunctionStorage {
  query<Row = Record<string, unknown>>(input: StorageQuery): Promise<StorageQueryResult<Row>>;
  insert(input: StorageInsert): Promise<StorageWriteResult>;
  update(input: StorageUpdate): Promise<StorageWriteResult>;
  delete(input: StorageDelete): Promise<StorageWriteResult>;
}

// Intersects an existing Function context type with the not-yet-shipped
// `storage` capability. `FunctionEventContext` from the toolkit is a `type`
// alias rather than an `interface`, so it can't be extended via `declare
// module` augmentation — this intersection is the workaround.
export type WithStorage<Context> = Context & { storage?: FunctionStorage };
