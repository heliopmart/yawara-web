'use client'; 

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './sideNav.module.scss';

interface NavLink {
  label: string;
  href: string;
}

interface SideNavProps {
  links: NavLink[];
  isOpen: boolean;
  onClose: () => void; 
}

const SideNav: React.FC<SideNavProps> = ({ links, isOpen, onClose }) => {
  const pathname = usePathname();

  return (
    <div className={`${styles.sideNav} ${isOpen ? styles.sideNavOpen : ''}`}>
      
      <button className={styles.closeButton} onClick={onClose} aria-label="Close Menu">
          &times;
      </button>

      <div className={styles.logoPlaceholder}>
        <Link href='/'><span className={styles.logoText}>TEAM YAWARA</span></Link>
        <span className={styles.logoSubtext}>MOTOSTUDENT</span>
      </div>
      
      <nav className={styles.navMenu}>
        <ul className={styles.navList}>
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href) && 
                             (pathname === link.href || link.href !== '/in/selection-process');

            return (
              <li key={link.href} className={styles.navItem}>
                <Link 
                  href={link.href} 
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                  onClick={onClose}
                >
                  {link.label.toUpperCase()}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className={styles.separator} />
    </div>
  );
};

export default SideNav;