import React from 'react';
import styles from './ArtGrid.module.scss'

import { ArttcsGridProps, ArtsGridProps } from '@yawara/types'; 

export const ArtGrid = ({data, title, type}: {data: ArttcsGridProps[] | ArtsGridProps[], title: string, type: string}) => {
    return (
        <div className={styles.sectionWrapper}>
            <h3 className={styles.sectionTitle}>{title}</h3>
            <div className={styles.artGrid}>
                {data.map((item) => (
                    <div key={item.id} className={styles.artCard}>
                        <div className={styles.cardHeader}>
                            <span className={styles.badge}>{item.type}</span>
                            <h4>{item.title}</h4>
                        </div>
                        
                        <p className={styles.cardDescription}>{item.description}</p>
                        
                        <div className={styles.cardFooter}>
                            <div className={styles.memberList}>
                                {item.members?.map((m: any) => (
                                    <span key={m.id} className={styles.memberName}>
                                        {`${m.name.split(' ')[0]} | ${m.role}`} 
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
