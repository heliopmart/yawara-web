import { useState, useEffect } from 'react';
import { MyAccountUserDataRepository, WorkCard } from '@yawara/types';

export const useMyAccount = () => {
    const [user, setUser] = useState<MyAccountUserDataRepository>();
    const [somethingChanged, setSomethingChanged] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [workItems, setWorkItems] = useState<WorkCard[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    const [signatureToken, setSignatureToken] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) {
            return
        }

        setUser({ ...user, [e.target.name]: e.target.value });
        setSomethingChanged(true)
    };

    const handleUpdateInformation = async () => {
        if (somethingChanged) {
            try {
                const response = await fetch('/api/user/my-account',
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: user?.name,
                            phone: user?.phone
                        })
                    });

                if (!response.ok) {
                    throw new Error(`Erro ao buscar dados do usuário: ${response.statusText}`);
                }
                const data = await response.json();

                if (!data.success) {
                    throw data.message;
                }

                setSomethingChanged(false)
            } catch (error) {
                console.error('useMyAccount.handleGetUserData error:', error);
            }
        }

        setIsEditing(!isEditing);
    }

    const handleDownloadData = (type: 'general' | 'ai') => {
        alert(`Iniciando download dos dados: ${type === 'general' ? 'Gerais' : 'Treinamento IA'}`);
    };

    const handleDangerAction = async (action: 'deactivate' | 'quit') => {
        const message = action === 'deactivate'
            ? "Tem certeza que deseja desativar a conta temporariamente?"
            : "Tem certeza que deseja requisitar seu desligamento do Team Yawara? Esta ação é irreversível.";

        if (confirm(message)) {
            const response = await fetch('/api/auth/disable-account',
                {
                    method: 'PUT'
                });

            if (!response.ok) {
                throw new Error(`Erro ao buscar dados do usuário: ${response.statusText}`);
            }
            const data = await response.json();

            if (!data.success) {
                throw data.message;
            }

            window.location.href = '/login';
        }
    };

    const handleGetUserData = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/user/my-account', { method: 'GET' });

            if (!response.ok) {
                throw new Error(`Erro ao buscar dados do usuário: ${response.statusText}`);
            }
            const data = await response.json();

            if (!data.success) {
                throw data.message;
            }

            setUser(data.data);
            handleGetWorkItemsFromData(data.data);
            setLoading(false)
        } catch (error) {
            console.error('useMyAccount.handleGetUserData error:', error);
        }
    }

    const generateSignature = async () => {
        setIsGenerating(true)

        try{
            const res = await fetch('/api/user/my-account/sign', {
                method: 'POST'
            });
            if(!res.ok){
                throw "INTERNAL_SERVER_ERROR"
            }

            const data = await res.json();

            if(!data.success){
                throw data.message || "INTERNAL_SERVER_ERROR"
            }

            setSignatureToken(data.data)
        }catch(error){
            console.error('useMyAccount.generateSignature error:', error);
        }finally{
            setIsGenerating(false)
        }
    };

    const handleGetWorkItemsFromData = (data: MyAccountUserDataRepository) => {
        const artList: WorkCard[] = data.users_arts.map((item) => ({
            original_id: item.art.id || "",
            id: item.art.code,
            type: 'ART',
            code: item.art.code,
            title: item.art.title,
            status: item.art.status as 'ACTIVE' | 'FINALIZED',
            role: item.role
        }));

        const arttcList: WorkCard[] = data.users_arttcs.map((item) => ({
            original_id: item.arttc.id || "",
            id: item.arttc.code,
            type: 'ARTTC',
            code: item.arttc.code,
            title: item.arttc.title,
            status: item.arttc.status as 'ACTIVE' | 'FINALIZED',
            role: undefined
        }));

        setWorkItems([...artList, ...arttcList]);
    }

    useEffect(() => {
        handleGetUserData();
        return
    }, [])

    return {
        user,
        workItems,
        isEditing,
        loading,
        signatureToken,
        isGenerating,
        generateSignature,
        handleUpdateInformation,
        setUser,
        handleInputChange,
        handleDownloadData,
        handleDangerAction
    }
}