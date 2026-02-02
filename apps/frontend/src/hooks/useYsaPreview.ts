import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const useYsaPreview = () => {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleStartAnalysis = () => {
        setIsAnalyzing(true);
        setProgress(0);
        handleUploadFile();
    };

    const handleUploadFile = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/ysna/preview', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw 'INTERNAL_SERVER_ERROR';

            const contentLength = res.headers.get('Content-Length');
            
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            
            if(!res.body){
                throw 'NO_RESPONSE_BODY';
            }

            const reader = res.body.getReader();
            const chunks = [];
            let receivedLength = 0; 

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break; 
                }

                chunks.push(value);
                receivedLength += value.length;

                if (total > 0) {
                    const percent = Math.round((receivedLength / total) * 100);
                    setProgress(percent);
                }
            }

            const blob = new Blob(chunks, { type: 'application/pdf' });
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Y-SNA_Report_PREVIEW_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error uploading/downloading:', error);
        } finally {
            setIsAnalyzing(false);
            setTimeout(() => setProgress(0), 1000); 
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