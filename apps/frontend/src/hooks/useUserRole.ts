'use client';

import { useState, useEffect } from 'react';
import { AuthRole } from '@yawara/types';

export const useUserRole = () => {
    const [role, setRole] = useState<AuthRole>('USER');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchRole = async () => {
            try {
                const res = await fetch('/api/auth/role');
                const data = await res.json();

                if (isMounted) {
                    setRole(data.role as AuthRole);
                }
            } catch (error) {
                console.error("Erro ao buscar role:", error);
                if (isMounted) setRole('GUEST');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchRole();

        return () => { isMounted = false; };
    }, []);

    return { role, isLoading };
};