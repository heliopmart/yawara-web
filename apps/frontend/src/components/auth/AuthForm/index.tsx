// apps/frontend/src/components/auth/AuthForm/index.tsx

'use client'; 

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './authForm.module.scss';

// Tipos para configurar o formulário (Você pode mover para @yawara/types se quiser compartilhar)
interface AuthFormProps {
  type: 'login' | 'register' | 'forgot';
  title: string;
  fields: { name: string; label: string; type: string, minLength?: number }[];
  buttonText: string;
  error: { message: string } | null;
  onSubmit: (data: Record<string, string>) => void; 
}

const AuthForm: React.FC<AuthFormProps> = ({ type, title, fields, buttonText, error, onSubmit }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <h2 className={styles.title}>{title.toUpperCase()}</h2>
        
        {error && <div className={styles.errorMessage}><span>{error.message}</span></div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {fields.map((field) => (
            <div key={field.name} className={styles.fieldGroup}>
              <label htmlFor={field.name} className={styles.label}>
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                value={formData[field.name] || ''}
                onChange={handleChange}
                className={styles.input}
                required
                minLength={field?.minLength || 0}
                placeholder={field.label} 
              />
            </div>
          ))}

          <button type="submit" className={styles.submitButton}>
            {buttonText.toUpperCase()}
          </button>
        </form>

        {/* Links adicionais baseados no tipo do formulário */}
        <div className={styles.footerLinks}>
          {type === 'login' && (
            <>
              <Link href="/forgot-password" className={styles.smallLink}>
                Esqueceu a senha?
              </Link>
              {/* O separador '|' foi removido via SCSS para separar os links verticalmente */}
              <Link href="/registre" className={styles.registerLink}>
                Cadastre-se
              </Link>
            </>
          )}
          {type === 'register' && (
             <Link href="/login" className={styles.smallLink}>
                Já tenho conta. Fazer Login
              </Link>
          )}
          {/* Você adicionará um link para voltar ao login na tela de Forgot Password */}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;