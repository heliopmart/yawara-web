import { supabase } from '@/lib/db';
import { CallRpcReturn, CallRpcParams } from '@yawara/types';

export const callRpc = async <ReturnType>({
    functionName,
    params,
    bd = supabase
}: CallRpcParams): Promise<CallRpcReturn<ReturnType>> => {
    const { error, data } = await bd
        .rpc(functionName, params)
        .throwOnError();

    if (error) {
        console.error(`Supabase RPC error in function ${functionName}:`, error);
        throw error;
    }

    return { status: true, data: data || null };
};