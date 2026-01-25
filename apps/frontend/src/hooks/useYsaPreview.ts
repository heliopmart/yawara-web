import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

            setProgress(75);

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `Y-SNA_Report_PREVIEW_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setProgress(100);
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