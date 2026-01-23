import {useState, useEffect, useCallback} from 'react';
import {Tool, ToolShowProps} from '@yawara/types';

export const useTools = () => {
    const [tools, setTools] = useState<ToolShowProps[]>([]);
    const [filteredTools, setFilteredTools] = useState<ToolShowProps[]>([]);
    const [search, setSearch] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    const handleFetchTools = useCallback(async () => {
        try {
            const response = await fetch('/api/tool');
            if (!response.ok) {
                throw new Error('Failed to fetch tools');
            }
            const data: ToolShowProps[] = (await response.json()).data;

            setTools(data);
            setFilteredTools(data);
        } catch (error) {
            console.error('Error fetching tools:', error);
        } finally {
            setLoading(false);
        }
    }, [filteredTools]);

    const handleSearch = (term: string) => {
        setSearch(term);
        if (term.trim() === '') {
            setFilteredTools(tools);
        } else {
            const lowerTerm = term.toLowerCase();
            const filtered = tools.filter(tool =>
                tool.name.toLowerCase().includes(lowerTerm) ||
                tool.target.toLowerCase().includes(lowerTerm)
            );
            setFilteredTools(filtered);
        }
    }

    const handleAllocateTool = async (id: string) => {
        try {
            const response = await fetch(`/api/tool/allocate`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({id}),
            });
            if (!response.ok) {
                throw new Error('Failed to allocate tool');
            }
            await handleFetchTools();
        } catch (error) {
            console.error('Error allocating tool:', error);
        }
    }

    const handleDeallocateTool = async (id: string, quantity: number) => {
        try {
            const response = await fetch(`/api/tool/deallocate`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({id, quantity}),
            });
            if (!response.ok) {
                throw new Error('Failed to deallocate tool');
            }
            await handleFetchTools();
        } catch (error) {
            console.error('Error allocating tool:', error);
        }
    }


    useEffect(() => {
        handleFetchTools();
    }, []);

    return {
        tools, filteredTools, search, loading, handleSearch, handleAllocateTool, handleDeallocateTool}
}