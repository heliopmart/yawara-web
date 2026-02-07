import { useEffect, useState } from 'react';
import { NucleiShowProps } from '@yawara/types';

export const useAboutUs = () => {
    const [nuclei, setNuclei] = useState<NucleiShowProps[]>([]);

    const handleGet = async () => {
        try {
            const res = await fetch('/api/admin/nuclei', { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            if (!res.ok) {
                throw 'Erro ao buscar núcleos';
            }

            const data = await res.json();

            if (!data.success) {
                throw data.error.message
            }

            setNuclei(data.data);
        } catch (error) {
            console.error('Erro ao buscar núcleos:', error);
        }
    }

    useEffect(() => {
        handleGet()
    }, [])

    return {
        nuclei
    }
}