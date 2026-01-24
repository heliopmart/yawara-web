import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export const useYsaPreview = () => {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleStartAnalysis = () => {
        setIsAnalyzing(true);
        let p = 0;

        handleUploadFile();

        const interval = setInterval(() => {
            p += Math.random() * 15;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                setTimeout(() => setIsAnalyzing(false), 500);
            }
            setProgress(Math.floor(p));
        }, 300);
    };

    const handleUploadFile = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/ysna/preview', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) {
                throw 'INTERNAL_SERVER_ERROR';
            }

            const blob = await res.blob();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Resultado_YSNA_${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();

            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setIsAnalyzing(false);
            setProgress(0);
        }
    }


    return {
        file, setFile,
        isAnalyzing,
        progress,
        handleStartAnalysis,

        router
    }
}