import { useSearchParams } from 'next/navigation';
import { ApiResponse, CertificateData } from '@yawara/types'
import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { z } from 'zod';
import { validateCpf } from '@/utils/handle_validate_cpf'

export const useCertificate = () => {
    const [mode, setMode] = useState<'input' | 'camera'>('input');
    const [activeTab, setActiveTab] = useState<'validate' | 'search'>('validate');
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CertificateData | CertificateData[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const code = searchParams.get('code');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (activeTab === 'search') {
            value = value.replace(/\D/g, '')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        }

        setInputValue(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue) return;

        setLoading(true);
        setResult(null);
        setError(null)

        try {
            const response = activeTab === 'validate'
                ? await CertificateService.validateCode(inputValue)
                : await CertificateService.searchByCpf(inputValue);

            if (!response.success) {
                setError(response.error.message || 'Erro ao processar a solicitação.');
                return
            }

            setResult(response.data || null);
        } catch (err: any) {
            setError(err.message);
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const switchTab = (tab: 'validate' | 'search') => {
        setActiveTab(tab);
        setResult(null);
        setError(null)
        setInputValue('');
    };

    const handle_download_certificate = async (id?: string) => {
        try {
            if (!id) throw new Error("ID do certificado é obrigatório para download.");

            await CertificateService.download(id);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(String(error));
            }
        }
    }

    const codeSchema = z.string().uuid("O código deve ser um UUID válido.");

    const CertificateService = {
        validateCode: async (code: string): Promise<ApiResponse<CertificateData>> => {

            const parsed = codeSchema.safeParse(code);
            if (!parsed.success) {
                throw new Error("Formato de código inválido (deve ser um UUID).");
            }

            try {
                const res = await fetch(`/api/certificates/validate?code=${code}`, { method: 'GET' });
                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.error.message || "Erro ao validar o certificado.");
                }

                return data
            } catch (error) {
                throw error;
            }
        },

        searchByCpf: async (cpf: string): Promise<ApiResponse<CertificateData[]>> => {

            const isValid = validateCpf(cpf);
            if (!isValid.valid) {
                setError(isValid.message);
                throw new Error("CPF inválido.");

            }

            try {
                const res = await fetch(`/api/certificates?cpf=${cpf}`, { method: 'GET' });
                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.error.message || "Erro ao buscar certificados.");
                }

                return data
            } catch (error) {
                throw error
            }
        },

        download: async (id: string): Promise<void> => {
            try {
                const res = await fetch(`/api/certificates/download?id=${id}`, { method: 'GET' });
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);

                const contentDisposition = res.headers.get('Content-Disposition');
                let fileName = `certificado-yawara-${id}.pdf`; // Fallback

                if (contentDisposition) {
                    const starMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);

                    if (starMatch && starMatch[1]) {
                        fileName = decodeURIComponent(starMatch[1]);
                    } else {
                        const normalMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                        if (normalMatch && normalMatch[1]) {
                            fileName = normalMatch[1];
                        }
                    }
                }

                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                throw error;
            }
        }
    };

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const qrCodeRegionId = "html5qr-code-full-region";

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
                scannerRef.current = null;
                setMode('input');
            } catch (err) {
                console.warn("Erro ao parar scanner:", err);
            }
        }
    };

    useEffect(() => {
        if (mode === 'camera') {
            const startScanner = async () => {
                try {
                    const html5QrCode = new Html5Qrcode(qrCodeRegionId);
                    scannerRef.current = html5QrCode;

                    const config = {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
                    };

                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText) => {
                            handleScanSuccess(decodedText);
                        },
                        (errorMessage) => {
                        }
                    );
                } catch (err) {
                    setError("Erro ao iniciar a câmera. Verifique as permissões.");
                    setMode('input');
                }
            };

            const timer = setTimeout(() => {
                startScanner();
            }, 100);

            return () => {
                clearTimeout(timer);
                stopScanner();
            };
        } else {
            stopScanner();
        }
    }, [mode]);

    const handleScanSuccess = async (decodedText: string) => {
        await stopScanner();

        const match = decodedText.match(
            /(?:\?|&)code=([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/
        );

        if (!match) {
            console.error('Código não encontrado na URL escaneada:', decodedText);
            return;
        }

        const code = match[1];


        setInputValue(code);
        setMode('input');
        try{
            const response = await CertificateService.validateCode(code);
            if(!response.success){
                throw response.error.message || 'Erro ao processar a solicitação.';
            }
            setResult(response.data || null);
        }catch(err){
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    useEffect(() => {
        const run = async () => {
            if (code) {
                setLoading(true);
                setInputValue(code)
                try {
                    const response = await CertificateService.validateCode(code);
                    if (!response.success) {
                        setError(response.error.message || 'Erro ao processar a solicitação.');
                        return
                    }

                    setResult(response.data || null);
                } catch (err: any) {
                    setError(err.message);
                    setResult(null);
                } finally {
                    setLoading(false);
                }
            }
        };

        run();
    }, [code])

    return {
        activeTab,
        inputValue,
        loading,
        result,
        error,
        mode,
        qrCodeRegionId,
        setMode,
        handleInputChange,
        handleSubmit,
        switchTab,
        handle_download_certificate
    }
}