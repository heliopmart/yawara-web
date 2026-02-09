import { AboutUsData } from '@yawara/types';

async function getAboutUsData(): Promise<AboutUsData> {
    try{
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/aboutUs`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            next: { revalidate: 3600 * 24 * 15 }
        });

        if (!res.ok) {
            throw 'Erro ao buscar dados do About Us';
        }

        const data = await res.json();

        if (!data.success) {
            throw data.error.message
        }

        return data.data as AboutUsData;
    }catch(error){
        console.error('Erro ao buscar dados do About Us:', error);
        return {
            nuclei: [],
            members: []
        }
    }
}

export const useAboutUs = async () => {
    const aboutUsData = await getAboutUsData();

    return {
        nuclei: aboutUsData.nuclei,
        members: aboutUsData.members
    }
}