import styles from './Innovation.module.scss';
import { 
  FaMicrochip, FaBrain, FaCogs, FaBolt, 
  FaIndustry, FaUsers, FaChartLine, FaBriefcase 
} from 'react-icons/fa';

const Innovation = () => {
  return (
    <div className={styles.techWrapper}>
      {/* Hero - Impacto na Universidade */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.topLabel}>Hub de Inovação UFGD</span>
          <h1>Inovação Transversal</h1>
          <p>
            O Projeto Yawara redefine a experiência acadêmica ao integrar múltiplas 
            áreas da engenharia em um ciclo completo de desenvolvimento tecnológico, 
            da concepção ao mercado.
          </p>
        </div>
      </section>

      {/* Seção Y-SNA & Software (Seu Core) */}
      <section className={styles.highlightSection}>
        <div className={styles.container}>
          <div className={styles.techCardMain}>
            <div className={styles.cardContent}>
              <FaBrain className={styles.mainIcon} />
              <h2>Y-SNA: Inteligência na Admissão</h2>
              <p>
                Inovamos ao aplicar Redes Neurais para otimizar o sistema de admissão. 
                O Y-SNA não é apenas código; é a fusão de Engenharia de Software com 
                termodinâmica, permitindo ajustes em tempo real que motores convencionais 
                não alcançam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Multidisciplinaridade - As Engenharias */}
      <section className={styles.gridSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Sinergia entre Engenharias</h2>
          <div className={styles.grid}>
            <div className={styles.compactCard}>
              <FaCogs />
              <h3>Engenharia Mecânica</h3>
              <p>Prototipagem de alta precisão, análise de fluidos (CFD) e desenvolvimento do motor a hidrogênio.</p>
            </div>
            <div className={styles.compactCard}>
              <FaBolt />
              <h3>Engenharia Elétrica</h3>
              <p>Sistemas de potência, gerenciamento de baterias e eletrônica embarcada para controle do protótipo.</p>
            </div>
            <div className={styles.compactCard}>
              <FaIndustry />
              <h3>Engenharia de Produção</h3>
              <p>Otimização de processos, gestão de manufatura e logística de suprimentos para o Yawara.</p>
            </div>
            <div className={styles.compactCard}>
              <FaMicrochip />
              <h3>Engenharia de Computação</h3>
              <p>Hardware, Software e processos tecnológicos integrados para inovação contínua. Perfeita para o modelo inovador do Yawara</p>
            </div>
          </div>
        </div>
      </section>

      {/* Inovação em Gestão e Mercado */}
      <section className={styles.managementSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Além do Hardware: Gestão e Capacitação</h2>
          <div className={styles.managementGrid}>
            <div className={styles.infoBox}>
              <FaUsers />
              <h3>Gestão por ARTs</h3>
              <p>
                Inovamos na universidade ao adotar a Anotação de Responsabilidade Técnica (ART) 
                dentro do projeto. Isso garante rastreabilidade, responsabilidade profissional 
                e prepara o estudante para a governança do mercado real.
              </p>
            </div>
            <div className={styles.infoBox}>
              <FaBriefcase />
              <h3>Integração com o Mercado</h3>
              <p>
                Atuamos como um elo entre a academia e empresas. Nossos membros são capacitados 
                em ferramentas industriais, gestão de projetos e resolução de problemas complexos, 
                reduzindo a distância entre o diploma e a carreira.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Innovation;