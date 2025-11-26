import { supabase } from '@/lib/db';
import {InsertRowReturn, InsertRowParams  } from '@yawara/types';


export const insertRow = async <ReturnType, InsertType>({
  table,
  insertData,
  bd = supabase
}: InsertRowParams<InsertType>): Promise<InsertRowReturn<ReturnType>> => {
  const { error, data } = await bd
    .from(table)
    .insert(insertData)
    .select()                      
    .throwOnError();                

  if (error) {
    console.error('Supabase insert error:', error);
    throw error;
  }

  if(Array.isArray(data)) {
    
  }

  const rows = Array.isArray(data) && data.length > 1 ? data : data?.[0]

  if (!rows) {
    return { status: false, data: null };
  }

  return { status: true, data: rows };
};