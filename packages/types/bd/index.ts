import {ApiResponse} from '../responses';

export type InsertRowParams<InsertType> = {
  table: string;
  insertData: InsertType;
  security?: boolean;
  bd?: any;
};

export type InsertRowReturn<T> =
  | { status: true; data: T }
  | { status: false; data: null };

export interface DeleteRowParams {
  table: string;
  uid?: string;
  filters?: Filter[];
  bd?: any
  security?: boolean;
}

export type WhereOp =
  | 'eq' | 'ilike' | 'is' | 'in'
  | 'gt' | 'gte' | 'lt' | 'lte';

export type WhereClause = { column: string; op?: WhereOp; value: unknown };

export type UpdateByIdParams<T> = {
  table: string;
  uid: string;              // atualiza .eq('id', uid)
  data: T;
  select?: string;          // ex: 'id, email' | '*' (opcional)
  authBd?: any;
  security?: boolean;
};

export type UpdateByWhereParams<T> = {
  table: string;
  where: WhereClause[];     // ex: [{column:'authId', op:'eq', value: authId}]
  data: T;
  select?: string;
  authBd?: any;
  security?: boolean;
};

export type UpdateRowParams<T> = UpdateByIdParams<T> | UpdateByWhereParams<T>;

export type UpdateRowReturn<ReturnType> = ApiResponse<{
  updated: number;
  rows?: ReturnType[];      // presente se select informado
}>;

export type Op =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'not.in'
  | 'like' | 'ilike'
  | 'in' | 'is'
  | 'contains' | 'containedBy' | 'overlaps';

export type Filter = {
  column: string;
  op: Op;
  value: any;
};

export type OrderBy = { column: string; ascending?: boolean; nullsFirst?: boolean };

export interface SelectParams<T> {
  table: string;
  columns?: string | string[];  // pode ser "*", ["id","email"], ou string com relação
  filters?: Filter[];           // [{ column:'email', op:'eq', value:'a@b.com' }]
  match?: Record<string, any>;  // atalho para .match({ userId, status: 'ACTIVE' })
  orderBy?: OrderBy;
  limit?: number;
  range?: { from: number; to: number };
  single?: boolean;             // true => .single()
  bd?: any
  security?: boolean;
}

export interface CallRpcParams {
    functionName: string;
    params: Record<string, any>;
    bd?: any;
}

export interface CallRpcReturn<ReturnType> {
    status: boolean;
    data: ReturnType | null;
}