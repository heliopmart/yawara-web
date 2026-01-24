import { ToolsRepository } from '@/lib/repository/tools/tools.repository'
import { TokenPayload, Tool, ToolShowProps } from '@yawara/types'

export class ToolsService {
    private auth: TokenPayload;
    private toolsRepository: ToolsRepository;

    constructor(auth: TokenPayload) {
        this.auth = auth;
        this.toolsRepository = new ToolsRepository(this.auth);
    }

    // ===========================================
    // =================== GET ===================
    // ===========================================

    /**
     * Get all tools
     * @return Promise<Tool[]>
     */
    async getTools(): Promise<ToolShowProps[]>{
        try{
            return await this.toolsRepository.getTools();
        }catch(error){
            throw error;
        }
    }

    // ===========================================
    // ================= UPDATE ==================
    // ===========================================

    /**
     * Update a tool by ID
     * @param toolId - ID of the tool to update
     * @param data - Partial data to update the tool
     * @return Promise<boolean>
     */
    async updateTool(toolId: Tool['id'], data: Partial<Tool>): Promise<boolean>{
        try{
            return await this.toolsRepository.updateTool(toolId, data);
        }catch(error){
            throw error;
        }   
    }

    async allocateTool(id: Tool['id']): Promise<boolean>{
        try{
            return await this.toolsRepository.allocateTool(id); 
        }catch(error){
            throw error;
        }
    }

    async deallocateTool(id: Tool['id'], quantity: number): Promise<boolean>{
        try{
            return await this.toolsRepository.deallocateTool(id, quantity); 
        }catch(error){
            throw error;
        }
    }

    // ===========================================
    // ================= CREATE ==================
    // ===========================================

    /**
     * Create a new tool
     * @param data - Partial data for the new tool
     * @return Promise<string> - ID of the created tool
     */
    async createTool(data: Partial<Tool>): Promise<string>{
        try{
            return await this.toolsRepository.createTool(data);
        }catch(error){
            throw error;
        }
    }
}