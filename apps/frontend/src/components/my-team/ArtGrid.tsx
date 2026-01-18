import React from 'react';
import styles from './ArtGrid.module.scss'

import { ART } from '@yawara/types'; 

interface ArtGridProps {
    title: string;
    items: any[]; 
    type: 'ART' | 'ARTTC';
}

export const ArtGrid: React.FC<ArtGridProps> = ({ title, items, type }) => {
    return (
        <div className={styles.sectionWrapper}>
            <h3 className={styles.sectionTitle}>{title}</h3>
            <div className={styles.artGrid}>
                {items.map((item) => (
                    <div key={item.id} className={styles.artCard}>
                        <div className={styles.cardHeader}>
                            <span className={styles.badge}>{type}</span>
                            <h4>{item.title}</h4>
                        </div>
                        
                        <p className={styles.cardDescription}>{item.description}</p>
                        
                        <div className={styles.cardFooter}>
                            <div className={styles.memberList}>
                                {item.members?.map((m: any) => (
                                    <span key={m.id} className={styles.memberName}>
                                        {m.name.split(' ')[0]}
                                    </span>
                                ))}
                            </div>
                            <button className={styles.viewButton}>Ver Detalhes</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
