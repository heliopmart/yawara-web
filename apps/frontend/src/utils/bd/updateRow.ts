import { supabase } from '@/lib/db';
import { UpdateRowParams, UpdateRowReturn, WhereClause } from '@yawara/types';

function applyWhere(q: any, w: WhereClause[]) {
  for (const { column, op = 'eq', value } of w) {
    switch (op) {
      case 'eq':  q = q.eq(column, value); break;
      case 'ilike': q = q.ilike(column, String(value)); break;
      case 'is':  q = q.is(column, value as any); break;               // null | true | false
      case 'in':  q = q.in(column, Array.isArray(value) ? value : [value]); break;
      case 'gt':  q = q.gt(column, value as any); break;
      case 'gte': q = q.gte(column, value as any); break;
      case 'lt':  q = q.lt(column, value as any); break;
      case 'lte': q = q.lte(column, value as any); break;
      default:    q = q.eq(column, value);
    }
  }
  return q;
}

export const updateRow = async <T, ReturnType = never>(
  params: UpdateRowParams<T>
): Promise<UpdateRowReturn<ReturnType>> => {
  try {
    const { table, data, select, authBd } = params;

    const bd = authBd ? authBd : supabase;

    let query = bd.from(table).update(data);

    if ('uid' in params) {
      query = query.eq('id', params.uid);
    } else {
      query = applyWhere(query, params.where);
    }

    const selectClause = select ?? 'id';
    const { data: rows, error } = await query
      .select(selectClause)
      .returns();

    if (error) {
      return {
        success: false,
        status: 1,
        error: { code: 'DB_UPDATE_ERROR', message: error.message },
        timestamp: new Date().toISOString(),
      };
    }

    const updated = rows?.length ?? 0;

    if (updated === 0) {
      return {
        success: false,
        status: 1,
        error: { code: 'DB_UPDATE_NOT_FOUND', message: 'Nenhuma linha atualizada.' },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      status: 1,
      data: { updated, rows: rows ?? [] },
      timestamp: new Date().toISOString(),
    };
  } catch (e: any) {
    return {
      success: false,
      status: 1,
      error: { code: 'DB_UPDATE_EXCEPTION', message: e?.message ?? 'Unknown error' },
      timestamp: new Date().toISOString(),
    };
  }
};