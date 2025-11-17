// apps/frontend/src/components/layout/Header/index.tsx

'use client'; // CRÍTICO: Habilita interatividade (useState e onClick)

import React, { useState } from 'react'; 
import Link from 'next/link';
import Image from 'next/image';
import { NavItem } from '@yawara/types';
import styles from './header.module.scss';
import { HEADER_LINKS } from '@/mocks/nav.mock';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Adicionamos o estado

  const renderLinks = (links: NavItem[]) => (
    // Aplicamos a classe condicional para o menu slide-out
    <ul className={styles.navList}>
        {links.map((link) => (
          <li key={link.href} className={styles.navItem}>
            <Link 
              href={link.href} 
              className={styles.navLink}
              onClick={() => setIsMenuOpen(false)} // Fecha o menu ao clicar
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
  );

  return (
    <header className={styles.header}>
      <div className={styles.contentWrapper}>
        
        {/* Logo Yawara */}
        <Link href="/" className={styles.logoContainer}>
          <Image
            src="/images/yawara-icon-color.png"
            alt="Yawara Logo"
            width={124}
            height={70}
            className={styles.logoImage}
          />
        </Link>

        {/* Desktop Nav (Visível apenas em Desktop) */}
        <div className={styles.desktopNav}>
            {renderLinks(HEADER_LINKS)}
        </div>
        
        {/* Mobile Nav Container (O menu que desliza) */}
        <div className={`${styles.mobileNav} ${isMenuOpen ? styles.navListOpen : ''}`}>
            {renderLinks(HEADER_LINKS)}
        </div>


        <Link href="/login" className={styles.loginButton}>
          Entrar
        </Link>
        
        {/* Botão que altera o estado */}
        <button 
          className={styles.menuToggle} 
          aria-label="Abrir Menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)} // Adicionamos o onClick
        >
            &#9776; 
        </button>
        
        {/* Overlay para fechar o menu ao clicar fora */}
        {isMenuOpen && <div className={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

      </div>
    </header>
  );
};

export default Header;