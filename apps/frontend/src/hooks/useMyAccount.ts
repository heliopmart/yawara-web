import { useState, useEffect } from 'react';
import { MyAccountUserDataRepository, WorkCard, WpaSubscription } from '@yawara/types';

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

        if (e.target.type === 'checkbox') {
            setUser({ ...user, [e.target.name]: e.target.checked });
        } else {
            setUser({ ...user, [e.target.name]: e.target.value });
        }

        setSomethingChanged(true)
    };

    const handleWpa = async () => {
        if (!user) {
            return
        }
        let subscription = null;
        let wpa_subscription = user?.wpa_subscription;
        let wpa_enabled = false;

        try {
            if (!user) {
                throw new Error("User data is not available.");
            }

            if (!('serviceWorker' in navigator)) {
                throw new Error("Service Worker não suportado pelo navegador.");
            }

            const registration = await navigator.serviceWorker.getRegistration();

            if (!registration) {
                console.error("Nenhum Service Worker encontrado. Certifique-se de que ele foi registrado no layout.");
                throw new Error("SW_NOT_REGISTERED");
            }

            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!publicVapidKey) throw new Error("VAPID Key não configurada.");

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            wpa_enabled = true;
            wpa_subscription = subscription.toJSON() as WpaSubscription;
        } catch (e) {
            console.error("Permissão de notificação negada.");
            wpa_enabled = false;
        }

        if(wpa_enabled){
            setUser({ ...user, wpa_enabled, wpa_subscription });
        }else{
            setUser({ ...user, wpa_enabled: false, wpa_subscription: null });
        }
    }

    const handleUpdateInformation = async () => {
        if (somethingChanged) {
            try {
                const response = await fetch('/api/user/my-account',
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: user?.name,
                            phone: user?.phone,
                            wpa_enabled: user?.wpa_enabled,
                            wpa_subscription: user?.wpa_subscription
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

        try {
            const res = await fetch('/api/user/my-account/sign', {
                method: 'POST'
            });
            if (!res.ok) {
                throw "INTERNAL_SERVER_ERROR"
            }

            const data = await res.json();

            if (!data.success) {
                throw data.message || "INTERNAL_SERVER_ERROR"
            }

            setSignatureToken(data.data)
        } catch (error) {
            console.error('useMyAccount.generateSignature error:', error);
        } finally {
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
        handleDangerAction,
        handleWpa
    }
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}