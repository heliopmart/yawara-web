'use client';

import React from 'react';
import { useCertificateForm } from '@/hooks/useCertificateForm';
import styles from './CertificateEmission.module.scss';

export default function EmissionPage() {
  const { formData, handleChange, handleSubmit, isLoading, status } = useCertificateForm();

  return (
    <main className={styles.container}>
      
      <div className={styles.header}>
        <h1>Emissão de <span>Certificados</span></h1>
        <p>Preencha os dados abaixo para registrar um novo certificado no sistema Yawara.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.formCard}>
        
        <div className={styles.inputGroup}>
          <label htmlFor="cpf">CPF do Aluno</label>
          <input
            id="cpf"
            name="cpf"
            type="text"
            placeholder="000.000.000-00"
            value={formData.cpf}
            onChange={handleChange}
            maxLength={14}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="student_name">Nome Completo</label>
          <input
            id="student_name"
            name="student_name"
            type="text"
            placeholder="Ex: Pedro da Silva"
            value={formData.student_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="course_name">Nome do Curso/Evento</label>
          <input
            id="course_name"
            name="course_name"
            type="text"
            placeholder="Ex: Workshop de Baterias Reutilizáveis"
            value={formData.course_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="hours">Carga Horária (horas)</label>
          <input
            id="hours"
            name="hours"
            type="number"
            placeholder="Ex: 40"
            min="1"
            value={formData.hours}
            onChange={handleChange}
            required
          />
        </div>

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Registrando...' : 'Emitir Certificado'}
        </button>

        {status === 'success' && (
          <div className={`${styles.feedback} ${styles.success}`}>
            Certificado registrado com sucesso!
          </div>
        )}

        {status === 'error' && (
          <div className={`${styles.feedback} ${styles.error}`}>
            Erro ao registrar. Verifique os dados e tente novamente.
          </div>
        )}

      </form>
    </main>
  );
}