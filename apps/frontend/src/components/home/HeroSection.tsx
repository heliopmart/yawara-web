import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './heroSection.module.scss';

const HeroSection: React.FC = () => {
    return (
        <section className={styles.heroSection}>
            <header className={styles.header}>
                <div className={styles.contentWrapper}>
                    <div className={styles.contentTitle}>
                        <h1 className={styles.title}>
                            Engenharia, inovação <br /> e propósito
                        </h1>
                        <h2 className={styles.subtitle}>
                            Criando tecnologias e conexões
                        </h2>
                    </div>
                    <div className={styles.imageHeaderContainer}>
                        <Image
                            src="/images/yawara-moto-hero.png"
                            alt="Motocicleta da equipe Yawara"
                            layout="fill"
                            objectFit="cover"
                            className={styles.heroImage}
                            priority
                        />
                    </div>
                </div>
            </header>

            <div className={styles.contentAboutYawara}>
                <div className={styles.contentWrapper}>
                    <div className={styles.imageContainer}>
                        <Image
                            src="/images/yawara_image_index_v3.png"
                            alt="Motocicleta da equipe Yawara"
                            layout="fill"
                            objectFit="cover"
                            className={styles.heroImage}
                            priority
                        />
                    </div>
                    <div className={styles.introBlock}>
                        <h3 className={styles.introTitle}>Yawara, um projeto inovador</h3>
                        <p className={styles.introText}>
                            O Projeto <i> Team Yawara MotoStudent </i> é uma iniciativa de extensão e inovação da UFGD que integra engenharia, design e tecnologia para o desenvolvimento de uma motocicleta movida a combustão e hidrogênio.
                        </p>
                        <p className={styles.introText}>
                            Nosso objetivo é engajar a comunidade acadêmica e social, promovendo oficinas, visitas técnicas e palestras, além de inspirar estudantes de escolas públicas a explorarem o universo da engenharia e da sustentabilidade.
                        </p>
                        <p className={styles.introText}>
                            O projeto também busca representar Mato Grosso do Sul em uma das mais desafiadoras provas universitárias de engenharia do mundo: o <b> MotoStudent </b> Espanha.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;