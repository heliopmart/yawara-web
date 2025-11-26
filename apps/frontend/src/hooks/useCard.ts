import { useState, useEffect } from 'react';
import { RecruitmentStep } from "@yawara/types";

export const useCard = (step: RecruitmentStep) => {
    const [file, setFile] = useState<File | undefined>(undefined);
    const [status, setStatus] = useState<RecruitmentStep['userState']>(step.userState);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    }

    const uploadFile = async () => {
        if (!file) return;
        if (!step.id) return;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('card_id', step.id.toString());

            const response = await fetch('/api/ps/upload', {
                method: 'POST',
                body: formData,
            });

            if(!response.ok){
                setStatus('FAILED');
            }

            const data = await response.json();

            if(data.success){
                setStatus('COMPLETED');
            }
        }
        catch (error) {
            console.error('File upload error:', error);
            setStatus('FAILED');
        }
    }

    useEffect(() => {
        if (!file) return;
        uploadFile();
        return () => { };
    }, [file])

    return {
        file,
        status,
        handleFileChange
    }
}