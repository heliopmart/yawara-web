// apps/frontend/src/components/home/SustentabilidadeSection.tsx

import React from 'react';
import styles from './sustentabilidadeSection.module.scss';

const SustentabilidadeSection: React.FC = () => {
  return (
    <section className={styles.sustentabilidadeSection}>
      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>
          Yawara, Por um planeta mais sustentável
        </h2>
        
        <p className={styles.paragraph}>
          O futuro da mobilidade exige novas formas de pensar energia, eficiência e responsabilidade ambiental.
        </p>
        
        <p className={styles.paragraph}>
          O Projeto <b> Team Yawara UFGD </b> abraça a sustentabilidade como eixo central de suas pesquisas, priorizando soluções limpas, reutilização de materiais e tecnologias de baixo impacto. 
          <u> Realizamos ações educativas e oficinas em escolas públicas </u>, incentivando jovens a participarem ativamente do engajamento na construção de um planeta mais equilibrado.
        </p>
        
        <p className={styles.paragraph}>
          Por meio do desenvolvimento do motor a hidrogênio, da gestão transparente, verídica e dinâmica com a Indústria 4.0 e focado no 4.0, buscamos transformar a inovação acadêmica em progresso ambiental e social.
        </p>

        {/* <div className={styles.inovacaoBlock}>
            <h3 className={styles.inovacaoTitle}>Nosso projeto faz <span className={styles.inovacaoHighlight}>INOVAÇÃO</span></h3>
            
            <div className={styles.inovacaoGrid}>
                <div className={styles.inovacaoItem}>Hidrogênio Verde</div>
                <div className={styles.inovacaoItem}>Gestão Transparente em tempo real</div>
                <div className={styles.inovacaoItem}>Motores de alta tecnologia</div>
                <div className={styles.inovacaoItem}>Tecnologias de automação</div>
            </div>
        </div> */}
        
      </div>
    </section>
  );
};

export default SustentabilidadeSection;