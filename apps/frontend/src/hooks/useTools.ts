import {useState, useEffect, useCallback} from 'react';
import {Tool} from '@yawara/types';

export const useTools = () => {
    const [tools, setTools] = useState<Tool[]>([]);
    const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
    const [search, setSearch] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    const handleFetchTools = useCallback(async () => {
        try {
            const response = await fetch('/api/tools');
            if (!response.ok) {
                throw new Error('Failed to fetch tools');
            }
            const data: Tool[] = await response.json();
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

    const handleAllocateTool = async (toolId: string) => {
        try {
            const response = await fetch(`/api/tools/allocate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({toolId}),
            });
            if (!response.ok) {
                throw new Error('Failed to allocate tool');
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
        tools, filteredTools, search, loading, handleSearch, handleAllocateTool}
}