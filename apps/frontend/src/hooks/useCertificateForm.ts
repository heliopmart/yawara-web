import { useState, ChangeEvent, FormEvent } from 'react';
import { CertificateFormFields } from '@yawara/types'

export const useCertificateForm = () => {
    const [formData, setFormData] = useState<CertificateFormFields>({
        cpf: '',
        student_name: '',
        course_name: '',
        hours: '0'
    });

    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Máscara marota de CPF (Engenheiro gosta de Regex)
    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'cpf') {
            setFormData(prev => ({ ...prev, [name]: formatCPF(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('idle');

        try {
            const res = await fetch('/api/admin/certificates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({...formData, hours: parseInt(formData.hours)}),
            })

            const data = await res.json();

            if(!data.success){
                throw data.error.message;
            }

            setStatus('success');
            setFormData({ cpf: '', student_name: '', course_name: '', hours: '0' });
        } catch (error) {
            console.error('Ops, o servidor tropeçou:', error);
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        formData,
        handleChange,
        handleSubmit,
        isLoading,
        status
    };
};