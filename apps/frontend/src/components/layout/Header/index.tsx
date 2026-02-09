'use client';

import React, { useState } from 'react'; 
import Link from 'next/link';
import Image from 'next/image';
import { NavItem } from '@yawara/types';
import styles from './header.module.scss';
import { HEADER_LINKS } from '@/mocks/nav.mock';

const BLUR_YAWARA_DATA_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAAsSAAALEgHS3X78AAAgAElEQVR4nO3de5BldX3/8fe5...'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const renderLinks = (links: NavItem[]) => (
    <ul className={styles.navList}>
        {links.map((link) => (
          <li key={link.href} className={styles.navItem}>
            <Link 
              href={link.href} 
              className={styles.navLink}
              onClick={() => setIsMenuOpen(false)}
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
        
        <Link href="/" className={styles.logoContainer}>
          <Image
            src="/images/yawara-icon-color.png"
            alt="Yawara Logo"
            blurDataURL={BLUR_YAWARA_DATA_IMAGE}
            placeholder="blur"
            width={124}
            height={70}
            className={styles.logoImage}
          />
        </Link>

        <div className={styles.desktopNav}>
            {renderLinks(HEADER_LINKS)}
        </div>
        
        <div className={`${styles.mobileNav} ${isMenuOpen ? styles.navListOpen : ''}`}>
            {renderLinks(HEADER_LINKS)}
        </div>


        <Link href="/login" className={styles.loginButton}>
          Entrar
        </Link>
        
        <button 
          className={styles.menuToggle} 
          aria-label="Abrir Menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)} // Adicionamos o onClick
        >
            &#9776; 
        </button>
        
        {isMenuOpen && <div className={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

      </div>
    </header>
  );
};

export default Header;