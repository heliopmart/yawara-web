import { useState, useEffect } from 'react';
import { TransparencyResponse } from "@yawara/types"

export const useTransparency = () => {
    const [nuclei, setNuclei] = useState<TransparencyResponse['nuclei']>([]);
    const [inventory, setInventory] = useState<TransparencyResponse['inventory']>([]);
    const [financial, setFinancial] = useState<TransparencyResponse['financial']>();
    const [ps_editions, setPsEditions] = useState<TransparencyResponse['ps_editions']>([]);
    const [loading, setLoading] = useState(true);
    const [loadingDownload, setLoadingDownload] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch('/api/transparency', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!res.ok) {
                    throw new Error('Erro ao buscar dados de transparência');
                }

                const resData = await res.json();
                const data: TransparencyResponse = resData.data

                setNuclei(data.nuclei);
                setInventory(data.inventory);
                setFinancial(data.financial);
                setPsEditions(data.ps_editions);

            } catch (error) {
                console.error("Falha ao sincronizar dados do Hub:", error);
                setLoading(false);
            } finally {
                setLoading(false)
            }
        };

        fetchDashboardData();
    }, []);

    const downloadArtDoc = (file_id: string, title: string) => {
        return handleDownloadDocFile(file_id, title || 'documento-art.pdf');
    }

    const downloadArttcDoc = (file_id: string, title: string) => {
        return handleDownloadDocFile(file_id, title || 'documento-arttc.pdf');
    }

    const downloadArttcReport = (file_id: string, title: string) => {
        return handleDownloadDocFile(file_id, title || 'relatório-arttc.pdf');
    }

    const downloadPsResult = (title: string, file_id?: string,) => {
        if (!file_id) return;
        return handleDownloadDocFile(file_id, title || 'relatório-arttc.pdf');
    }


    const handleDownloadDocFile = async (public_id: string | undefined, title: string): Promise<void> => {
        if (!public_id) return;
        setLoadingDownload(true)
        const safeName = encodeURIComponent(title.replace(/\s+/g, '_'));

        window.location.href = `/api/admin/myTeam/file_download?publicId=${public_id}&name=${safeName}`;
        setTimeout(() => setLoadingDownload(false), 6000);
    }

    return {
        nuclei, inventory, financial, ps_editions, loading, loadingDownload,
        downloadArtDoc, downloadArttcDoc, downloadArttcReport, downloadPsResult
    };
};

