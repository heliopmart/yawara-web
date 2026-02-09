import React from 'react';
import styles from './index.module.scss';
import { FaPlay, FaMicrochip, FaLeaf, FaTrophy, FaChevronRight } from 'react-icons/fa';
import Link from 'next/link'; 

const HomePage = () => {
  return (
    <div className={styles.homeWrapper}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <p className={styles.tagline}>Acelere o futuro com o Team Yawara</p>
          <h1>Onde a Engenharia Move a Transição Energética.</h1>
          <p className={styles.description}>
            Desenvolvemos tecnologias de propulsão a Hidrogênio e Sistemas Neurais (Y-SNA) 
            para uma mobilidade sustentável, com validação em competições internacionais.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/aboutUs" className={styles.btnPrimary}>
              Conheça o Projeto <FaChevronRight />
            </Link>
            <Link href="/about" className={styles.btnSecondary}>
              <FaPlay /> Assista o Vídeo
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.keyFeatures}>
        <div className={styles.container}>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <FaMicrochip className={styles.icon} />
              <h3>Tecnologia Avançada</h3>
              <p>Da mecânica à software, nossa engenharia é 100% proprietária.</p>
            </div>
            <div className={styles.featureCard}>
              <FaLeaf className={styles.icon} />
              <h3>Sustentabilidade</h3>
              <p>Hidrogênio Verde como vetor para um futuro sem emissões.</p>
            </div>
            <div className={styles.featureCard}>
              <FaTrophy className={styles.icon} />
              <h3>Performance Global</h3>
              <p>Testamos nossas soluções na MotoStudent internacional.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.innovationHighlight}>
        <div className={styles.container}>
          <div className={styles.highlightContent}>
            <div className={styles.textSide}>
              <h2>Y-SNA: A Inteligência por Trás da Eficiência.</h2>
              <p>
                Nosso Yawara System Neural Architecture é um sistema de IA 
                proprietário que otimiza a admissão e a performance do motor a hidrogênio 
                em tempo real. Uma Rede Neural adaptativa que aprende e evolui com 
                cada ciclo.
              </p>
              <Link href="/innovations" className={styles.learnMore}>
                Saiba Mais sobre o Y-SNA <FaChevronRight />
              </Link>
            </div>
            <div className={styles.imageSide}>
              <div className={styles.placeholderImage} >
                {/* <FaMicrochip />  */}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.callToAction}>
        <div className={styles.container}>
          <h2>Faça Parte da Próxima Revolução.</h2>
          <p>
            Seja um engenheiro, um parceiro ou um patrocinador.Juntos, vamos reduzir a lacuna tecnológica 
            do Brasil em energias limpas e inovadoras e assim, impactar o mundo.
          </p>
          <div className={styles.ctaButtonsSmall}>
            <Link href="/selection-process" className={styles.btnSecondary}>
              Processo Seletivo <FaChevronRight />
            </Link>
            <Link href="/sponsors" className={styles.btnPrimary}>
              Seja um Patrocinador <FaChevronRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};


export default HomePage;