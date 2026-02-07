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
            if (!res.body) throw 'NO_RESPONSE_BODY';

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedData = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                accumulatedData += decoder.decode(value, { stream: true });

                const lines = accumulatedData.split('\n');
                accumulatedData = lines.pop() || ''; 

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        const data = JSON.parse(line);

                        if (data.status === 'progress') {
                            setProgress(data.percent);
                        }

                        if (data.status === 'complete' && data.pdf_base64) {
                            const byteCharacters = atob(data.pdf_base64);
                            const byteNumbers = new Uint8Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const blob = new Blob([byteNumbers], { type: 'application/pdf' });

                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Y-SNA_Report_${new Date().getTime()}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                        }
                    } catch (e) {
                        console.warn("Chunk não processável como JSON:", line);
                        alert("Um erro foi detectado ao analizar seu histórico academico, tente novamente mais tarde.")
                    }
                }
            }
        } catch (error) {
            console.error('Erro no processamento assíncrono:', error);
            alert("O Servidor YSNA está passando por instabilidades, tente novamente mais tarde")
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