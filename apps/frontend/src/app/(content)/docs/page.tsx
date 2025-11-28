'use client';
import { useState } from 'react';
import styles from './docs.module.scss';
import { legalDocs } from '@/mocks/docs.mock'; 
import { FaFilePdf, FaChevronDown } from 'react-icons/fa'; 

export default function LegalDocsPage() {
  const [activeDocId, setActiveDocId] = useState(legalDocs[0].id);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeDoc = legalDocs.find(doc => doc.id === activeDocId) || legalDocs[0];

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h1>Transparência e Documentos</h1>
        <p>Acesse nossos termos, políticas e editais oficiais.</p>
      </header>

      <div className={styles.layout}>
        {/* SIDEBAR DE NAVEGAÇÃO */}
        <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
          <div className={styles.mobileToggle} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <span>Navegar pelos documentos</span>
            <FaChevronDown />
          </div>

          <nav>
            <ul>
              {legalDocs.map((doc) => (
                <li key={doc.id}>
                  <button 
                    className={activeDocId === doc.id ? styles.active : ''}
                    onClick={() => {
                      setActiveDocId(doc.id);
                      setIsMobileMenuOpen(false); // Fecha menu no mobile ao clicar
                    }}
                  >
                    {doc.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* ÁREA DE CONTEÚDO */}
        <main className={styles.contentArea}>
          <div className={styles.docHeader}>
            <div>
              <h2>{activeDoc.title}</h2>
              <span className={styles.date}>Atualizado em: {activeDoc.lastUpdated}</span>
            </div>
            
            {/* BOTÃO HÍBRIDO: Baixar PDF */}
            {activeDoc.pdfUrl && (
              <a href={activeDoc.pdfUrl} download className={styles.pdfButton}>
                <FaFilePdf /> Baixar PDF Original
              </a>
            )}
          </div>

          <div 
            className={styles.textBody}
            dangerouslySetInnerHTML={{ __html: activeDoc.content }} 
          />
        </main>
      </div>
    </div>
  );
}