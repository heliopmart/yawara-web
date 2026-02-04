'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './authForm.module.scss';
import {AuthFormProps} from "@yawara/types"

const AuthForm: React.FC<AuthFormProps> = ({ type, title, fields, buttonText, error, onForgotPassword, onSubmit }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleForgotPassword = () => {
    if (type === 'login' && typeof onForgotPassword === 'function') {
      onForgotPassword();
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <h2 className={styles.title}>{title.toUpperCase()}</h2>

        {error && <div className={styles.errorMessage}><span dangerouslySetInnerHTML={{ __html: error.message }}/></div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {fields.map((field) => (
            <div key={field.name} className={styles.fieldGroup}>
              <label htmlFor={field.name} className={styles.label}>
                {field.label}
              </label>

              {field.type === 'select' ? (
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  className={styles.input}
                  required
                >
                  <option value="" disabled>Selecione seu curso</option>

                  {Array.isArray(field.options) && typeof field.options[0] === 'object'
                    ? (field.options as any[]).map((group) => (
                      <optgroup key={group.college} label={group.college}>
                        {group.courses.map((course: string) => (
                          <option key={course} value={course}>
                            {course}
                          </option>
                        ))}
                      </optgroup>
                    ))
                    : (field.options as string[]).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))
                  }
                </select>
              ) : (
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
              )}
            </div>
          ))}

          <button type="submit" className={styles.submitButton}>
            {buttonText.toUpperCase()}
          </button>
        </form>

        <div className={styles.footerLinks}>
          {type === 'login' && (
            <>
              <button onClick={() => handleForgotPassword()} className={styles.smallLink}>
                Esqueceu a senha?
              </button>
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
        </div>
      </div>
    </div>
  );
};

export default AuthForm;