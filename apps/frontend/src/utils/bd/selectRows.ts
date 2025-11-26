import { supabase } from '@/lib/db';
import {SelectParams, Op, Filter, OrderBy } from '@yawara/types';


export async function getRows<T = any>({
    table,
    columns = '*',
    filters = [],
    match,
    orderBy,
    limit,
    range,
    single,
    bd = supabase
}: SelectParams<T>): Promise<T[] | T | null> {
    const columnsStr = Array.isArray(columns) ? columns.join(',') : columns;

    let q = bd.from(table).select(columnsStr);

    // filtros estruturados
    for (const f of filters) {
        switch (f.op) {
            case 'eq': q = q.eq(f.column, f.value); break;
            case 'neq': q = q.neq(f.column, f.value); break;
            case 'gt': q = q.gt(f.column, f.value); break;
            case 'gte': q = q.gte(f.column, f.value); break;
            case 'lt': q = q.lt(f.column, f.value); break;
            case 'lte': q = q.lte(f.column, f.value); break;
            case 'like': q = q.like(f.column, f.value); break;
            case 'ilike': q = q.ilike(f.column, f.value); break;
            case 'in': q = q.in(f.column, Array.isArray(f.value) ? f.value : [f.value]); break;
            case 'is': q = q.is(f.column, f.value); break; // null/true/false
            case 'contains': q = q.contains(f.column, f.value); break;      // jsonb, array
            case 'containedBy': q = q.containedBy(f.column, f.value); break;// jsonb, array
            case 'overlaps': q = q.overlaps(f.column, f.value); break;      // array
            default: throw new Error(`Operador não suportado: ${f.op}`);
        }
    }

    if (match && Object.keys(match).length) q = q.match(match);

    if (orderBy) {
        q = q.order(orderBy.column, {
            ascending: orderBy.ascending ?? true,
            nullsFirst: orderBy.nullsFirst ?? false,
        });
    }

    if (range) q = q.range(range.from, range.to);
    else if (typeof limit === 'number') q = q.limit(limit);

    if (single) {
        const { data, error } = await q.single();

        console.log(error)

        if(error?.code === 'PGRST116'){
            return null as any
        }

        if (error) throw (`SelectRowsError: ${error.message}`);
        return data as T | null;
    } else {
        const { data, error } = await q;

        if(error.code === 'PGRST116'){
            return null as any
        }

        if (error) throw (`SelectRowsError: ${error.message}`);
        return data as any;
    }
}
