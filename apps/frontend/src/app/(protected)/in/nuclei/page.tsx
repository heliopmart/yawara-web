'use client';

import {useNucleus} from '@/hooks/useNucleusManagement';
import styles from './nuclei.module.scss';


const NucleiPage = () => {
    const { nucleus } = useNucleus();

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleWrapper}>
                    <span className={styles.breadcrumb}>YAWARA / OPERAÇÕES</span>
                    <h1>Ecossistema de Núcleos</h1>
                </div>
            </header>

            <div className={styles.nucleiGrid}>
                {nucleus.map((n) => (
                    <section key={n.id} className={styles.nucleusCard}>
                        <div className={styles.cardHeader}>
                            <h2>{n.name}</h2>
                            <div className={styles.stats}>
                                <span>{n.nucleiConfig.totalMembers} MEMBROS</span>
                            </div>
                        </div>
                        
                        <div className={styles.artsSection}>
                            <h3>ARTs EM EXECUÇÃO</h3>
                            {n.activeArts.length > 0 ? (
                                <ul className={styles.artsList}>
                                    {n.activeArts.map(art => (
                                        <li key={art.id}>
                                            <span className={styles.artId}>[{art.id.toUpperCase()}]</span>
                                            {art.title}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.emptyMsg}>Nenhuma ART ativa no ciclo atual.</p>
                            )}
                        </div>
                    </section>
                ))}
            </div>
        </main>
    );
};

export default NucleiPage;