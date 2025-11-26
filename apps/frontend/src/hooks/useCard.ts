import { useState } from 'react';
import {RecruitmentStep} from "@yawara/types";

export const useCard = (step: RecruitmentStep) => {
    const [file, setFile] = useState<File | undefined>(undefined);
    const [status, setStatus] = useState<RecruitmentStep['userState']>(step.userState);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setStatus('COMPLETED');
        }
    }

    const uploadFile = () => {
        // Implement file upload logic here, e.g., send the file to the backend
        

    }

    return {
        file,
        status,
        handleFileChange
    }
}