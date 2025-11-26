import { supabase } from '@/lib/db';
import {DeleteRowParams } from '@yawara/types';


export const deleteRows = async ({ table, uid, filters = [], bd = supabase }: DeleteRowParams) => {
  let query = bd.from(table).delete();

  // Caso clássico: uid
  if (uid) {
    query = query.eq('id', uid);
  }

  // Filtros adicionais
  for (const f of filters) {
    switch (f.op) {
      case 'eq':
        query = query.eq(f.column, f.value);
        break;
      case 'in':
        query = query.in(f.column, f.value);
        break;
      case 'not.in':
        query = query.not(f.column, 'in', f.value);
        break;
      case 'is':
        query = query.is(f.column, f.value);
        break;
      default:
        throw new Error(`deleteRows: operador não suportado: ${f.op}`);
    }
  }

  const { error } = await query;
  if (error) throw error;


  return true;
};
