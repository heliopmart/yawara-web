'use client';

import { useState, useEffect } from 'react';
import { AuthRole } from '@yawara/types';

export const useUserRole = () => {
    const [role, setRole] = useState<AuthRole>('USER');
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<{ nucleus: string } | null>(null);

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
                if (isMounted) setRole('GUEST');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchRole();

        return () => { isMounted = false; };
    }, []);

    return { role, isLoading, user };
};