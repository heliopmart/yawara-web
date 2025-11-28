'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'; 
import { z } from 'zod';
import { FaCamera, FaKeyboard, FaCheckCircle, FaTimesCircle, FaSearch } from 'react-icons/fa';
import styles from './page.module.scss';

// Schema (mesmo de antes)
const codeSchema = z.string().uuid("O código deve ser um UUID válido.");

interface CertificateData {
  isValid: boolean;
  studentName?: string;
  courseName?: string;
  issueDate?: string;
  hours?: number;
}

export default function ValidateCertificatePage() {
  const [mode, setMode] = useState<'input' | 'camera'>('input');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "html5qr-code-full-region";

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
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
            formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ] 
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
    
    setCode(decodedText);
    setMode('input'); 
    handleValidate(decodedText);
  };

  const handleValidate = async (codeToValidate: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const parsed = codeSchema.safeParse(codeToValidate);
      if (!parsed.success) {
        throw new Error("Formato de código inválido (deve ser um UUID).");
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResponse: CertificateData = {
        isValid: true,
        studentName: "João da Silva",
        courseName: "Engenharia de Competição - MotoStudent",
        issueDate: "20/11/2024",
        hours: 40
      };

      setResult(mockResponse);

    } catch (err: any) {
      setError(err.message || "Certificado não encontrado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Validação de Certificado</h1>
          <p>Digite o código ou escaneie o QR Code.</p>
        </div>

        {/* MODO CÂMERA */}
        {mode === 'camera' && (
          <div className={styles.cameraWrapper}>
            <div id={qrCodeRegionId} style={{ width: '100%' }}></div>
            
            <button 
              className={styles.btnCancel}
              onClick={() => setMode('input')}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* MODO INPUT (Só aparece se NÃO estiver na câmera) */}
        {mode === 'input' && (
          <>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Ex: 550e8400-e29b-41d4..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={styles.actions}>
              <button 
                className={styles.btnPrimary} 
                onClick={() => handleValidate(code)}
                disabled={loading || !code}
              >
                {loading ? 'Verificando...' : <><FaSearch /> Verificar Código</>}
              </button>
              
              <button 
                className={styles.btnSecondary} 
                onClick={() => { setError(null); setMode('camera'); }}
                disabled={loading}
              >
                <FaCamera /> Escanear QR Code
              </button>
            </div>
          </>
        )}

        {/* MENSAGEM DE ERRO */}
        {error && (
          <div style={{ marginTop: '1.5rem', color: '#ef5350', padding: '1rem', background: 'rgba(239, 83, 80, 0.1)', borderRadius: '4px' }}>
            <FaTimesCircle style={{ marginRight: 5 }} /> {error}
          </div>
        )}

        {/* RESULTADO */}
        {result && result.isValid && (
          <div className={styles.result}>
            <span className={`${styles.statusBadge} ${styles.valid}`}>
              <FaCheckCircle style={{ marginRight: 5 }} /> Certificado Válido
            </span>

            <h3>{result.studentName}</h3>
            <p style={{ color: '#aaa', marginBottom: '1rem' }}>{result.courseName}</p>

            <div className={styles.detailRow}>
              <span>Data de Emissão:</span>
              <span>{result.issueDate}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Carga Horária:</span>
              <span>{result.hours}h</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}