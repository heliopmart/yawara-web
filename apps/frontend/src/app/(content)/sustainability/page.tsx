import styles from './Sustainability.module.scss';
import Link from 'next/link';
import { FaLeaf, FaMicrochip, FaGlobeAmericas, FaHandshake, FaSeedling, FaCity } from 'react-icons/fa';

const Sustainability = () => {
  return (
    <div className={styles.cleanWrapper}>
      {/* Header Minimalista */}
      <header className={styles.header}>
        <div className={styles.container}>
          <h1>Sustentabilidade</h1>
          <p>Desenvolvendo tecnologias nacionais para a transição energética global.</p>
        </div>
      </header>

      {/* Seção de Missão e ODS */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.gridInfo}>
            <div className={styles.textBlock}>
              <h2 className={styles.greenTitle}>Compromisso com o Futuro</h2>
              <p>
                O Projeto Yawara se enquadra nas diretrizes de inovação e extensão da UFGD, 
                promovendo a aplicação prática de conhecimentos para soluções de baixo 
                impacto ambiental. Nossa iniciativa busca transformar a pesquisa 
                acadêmica em tecnologia aplicada aos desafios reais do século XXI.
              </p>
            </div>
            
            <div className={styles.odsGrid}>
              <div className={styles.odsItem}>
                <FaGlobeAmericas className={styles.icon} />
                <h3>ODS 4</h3>
                <p>Educação de qualidade e aprendizado prático em engenharia.</p>
              </div>
              <div className={styles.odsItem}>
                <FaMicrochip className={styles.icon} />
                <h3>ODS 9</h3>
                <p>Indústria, inovação e infraestrutura tecnológica nacional.</p>
              </div>
              <div className={styles.odsItem}>
                <FaCity className={styles.icon} />
                <h3>ODS 11</h3>
                <p>Cidades e comunidades com veículos sustentáveis e eficientes.</p>
              </div>
              <div className={styles.odsItem}>
                <FaHandshake className={styles.icon} />
                <h3>ODS 17</h3>
                <p>Parcerias entre universidade, setor privado e instituições.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frentes de Atuação */}
      <section className={styles.frentesSection}>
        <div className={styles.container}>
          <h2 className={styles.centerTitle}>Frentes de Impacto Tecnológico</h2>
          <div className={styles.frentesGrid}>
            <div className={styles.frenteCard}>
              <FaLeaf />
              <h3>Hidrogênio Verde</h3>
              <p>
                Pesquisa aplicada no hidrogênio como vetor energético para motores de combustão 
                interna de alta eficiência e zero emissão de carbono local.
              </p>
            </div>
            <div className={styles.frenteCard}>
              <FaSeedling />
              <h3>Setor Agropecuário</h3>
              <p>
                Desenvolvimento de tecnologias de mecanização inteligente para promover a 
                transição energética no campo brasileiro.
              </p>
            </div>
            <div className={styles.frenteCard}>
              <FaCity />
              <h3>Mobilidade Urbana</h3>
              <p>
                Soluções para o transporte nas cidades, visando veículos mais eficientes e 
                menos poluentes para o contexto urbano nacional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chamada para Parceria */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <h2>Vamos construir um legado juntos?</h2>
          <p>
            O Projeto Yawara busca estabelecer parcerias com empresas e cooperativas para 
            a aplicação real das tecnologias criadas no Hub de Inovações da UFGD.
          </p>
          <Link href="/sponsors#be"><button className={styles.btnGreen}>Seja um Patrocinador</button></Link>
        </div>
      </section>
    </div>
  );
};

export default Sustainability;