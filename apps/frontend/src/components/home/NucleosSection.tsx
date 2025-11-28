import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './nucleosSection.module.scss';

import { NucleoItem } from '@yawara/types';

interface NucleosSectionProps {
    nucleos: NucleoItem[];
}

const NucleosSection: React.FC<NucleosSectionProps> = ({ nucleos }) => {

    const NucleoCard: React.FC<{ nucleo: NucleoItem }> = ({ nucleo }) => (
        <Link href={nucleo.slug} className={styles.cardLink}>
            <div className={styles.nucleoCard}>
                <div className={styles.iconPlaceholder}>
                    <Image
                        src={nucleo.image || ''}
                        alt={nucleo.titulo}
                        width={60}
                        height={60}
                        className={styles.nucleoImage}
                        objectFit='cover'
                    />
                </div>

                <h3 className={styles.cardTitle}>{nucleo.titulo}</h3>
                <p className={styles.cardDescription}>{nucleo.descricao}</p>
            </div>
        </Link>
    );

    return (
        <section className={styles.nucleosSection}>
            <div className={styles.contentWrapper}>
                <h2 className={styles.sectionTitle}>Nossos Núcleos de desenvolvimento</h2>

                <div className={styles.gridContainer}>
                    {nucleos.map((nucleo) => (
                        <NucleoCard key={nucleo.slug} nucleo={nucleo} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NucleosSection;