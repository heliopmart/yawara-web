'use client';

import React from 'react';
import styles from './processTimeline.module.scss';

export const LoadingState = () => {
    return (
        <div className={styles.loaderContainer}>
            <div className={styles.energyOrb}>
                <div className={styles.innerCore} />
                <div className={styles.orbit} />
            </div>
            <div className={styles.loadingText}>
                <span className={styles.glitch}>CARREGANDO PRÉ-DEFINIÇÕES</span>
                <p className={styles.subText}>Acessando seus dados, aguarde...</p>
            </div>
            <div className={styles.progressTrack}>
                <div className={styles.progressBar} />
            </div>
        </div>
    );
};
