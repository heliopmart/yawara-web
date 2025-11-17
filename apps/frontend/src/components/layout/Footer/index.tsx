import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './footer.module.scss';
import { FOOTER_LINKS } from '@/mocks/nav.mock';
import { NavItem } from '@yawara/types';

const Footer: React.FC = () => {
  
  const renderLinkColumn = (links: NavItem[], title: string) => (
    <div className={styles.footerColumn}>
      <h4 className={styles.columnTitle}>{title}</h4> 
      <ul className={styles.linkList}>
        {links.map((link) => (
          <li key={link.href} className={styles.linkItem}>
            <Link 
              href={link.href} 
              target={link.isExternal ? '_blank' : '_self'}
              rel={link.isExternal ? 'noopener noreferrer' : undefined}
              className={styles.footerLink}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  const group1 = FOOTER_LINKS.slice(0, 3);
  const group2 = FOOTER_LINKS.slice(3, 6);
  const group3 = FOOTER_LINKS.slice(6, 9);
  const group4 = FOOTER_LINKS.slice(9, 10);

  return (
    <footer className={styles.footer}>
      <div className={styles.mainContentWrapper}>
        
        <div className={styles.logoAndCopyright}>
          <div className={styles.logoContainer}>
            <Link href="/">
              <Image
                src="/images/yawara-icon-black.png"
                alt="Yawara MotoStudent Icon"
                width={200}
                height={120}
                className={styles.logoImage}
              />
            </Link>
          </div>
        </div>

        {/* --- GRID DE LINKS --- */}
        <div className={styles.linksGrid}>
          {renderLinkColumn(group1, 'Empresa')}
          {renderLinkColumn(group2, 'Comunidade')}
          {renderLinkColumn(group3, 'Documentação')}
          {renderLinkColumn(group4, 'Parcerias')}
        </div>

      </div>
      
      <div className={styles.copyrightBar}>
          <p className={styles.copyrightText}>
              Team Yawara MotoStudent © Todos os direitos e programação é propriedade intelectual da comunidade acadêmica.
          </p>
      </div>
    </footer>
  );
};

export default Footer;