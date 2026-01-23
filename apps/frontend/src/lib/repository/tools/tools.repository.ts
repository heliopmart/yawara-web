import { create_rls_client, supabaseAdmin } from "@/lib/db"
import { getRows, updateRow, callRpc, insertRow } from '@/utils/bd'
import { TokenPayload, Tool, ToolShowProps } from '@yawara/types'

export class ToolsRepository {
    private auth: TokenPayload;
    private TableToolsName = 'tools';
    private bd: ReturnType<typeof create_rls_client>;

    constructor(auth: TokenPayload) {
        this.auth = auth;
        this.bd = create_rls_client(this.auth?.supabaseToken ?? null);
    }

    // ===========================================
    // =================== GET ===================
    // ===========================================

    async getTools(): Promise<ToolShowProps[]> {
        try {
            const res = await getRows<ToolShowProps>({
                bd: this.bd,
                table: this.TableToolsName,
                columns: `id, name, status, target, quantity, is_tool, description, last_used_at, allocated_at,
                user_allocated: allocated_id ( id, name )`,
            });

            if (!res) throw 'ERROR_GET_TOOLS';

            return this.handleToolData(res as ToolShowProps[]) ;
        } catch (error) {
            throw error;
        }
    }

    // ===========================================
    // ================= UPDATE ==================
    // ===========================================

    async updateTool(id: Tool['id'], data: Partial<Tool>): Promise<boolean> {
        try {
            const res = await updateRow({
                data: data,
                table: this.TableToolsName,
                uid: id,
                authBd: this.bd,
            });

            if (!res.success) throw 'ERROR_UPDATE_TOOL';

            return res.success;
        } catch (error) {
            throw error;
        }
    }

    async allocateTool(id: Tool['id']): Promise<boolean> {
        try {
            const res = await callRpc<boolean>({
                bd: this.bd,
                functionName: 'allocate_tool',
                params: {
                    p_tool_id: id,
                    p_user_id: this.auth.user_id,
                }
            })

            if (!res.status) throw 'ERROR_ALLOCATE_TOOL';

            return res.data as boolean;
        } catch (error) {
            throw error;
        }
    }

    async deallocateTool(id: Tool['id'], quantity: number): Promise<boolean> {
        try {
            const res = await callRpc<boolean>({
                bd: this.bd,
                functionName: 'deallocate_tool',
                params: {
                    p_tool_id: id,
                    p_user_id: this.auth.user_id,
                    p_quantity: quantity
                }
            })

            if (!res.status) throw 'ERROR_DISPLACE_TOOL';

            return res.data as boolean;
        } catch (error) {
            throw error;
        }
    }

    // ===========================================
    // ================= CREATE ==================
    // ===========================================

    async createTool(data: Partial<Tool>): Promise<string> {
        try {
            const res = await insertRow<Tool, Partial<Tool>>({
                table: this.TableToolsName,
                bd: this.bd,
                insertData: data,
            })

            if (!res.status) throw 'ERROR_CREATE_TOOL';

            return res.data.id;
        }
        catch (error) {
            throw error;
        }
    }

    // ===========================================
    // ================= HANDLE ==================
    // ===========================================

    private handleToolData(tools: ToolShowProps[]): ToolShowProps[] {
        return tools.map(tool => {
            return {
                ...tool,
                user_is_owner: tool.user_allocated?.id === this.auth.user_id,
            }
        })
    }
}