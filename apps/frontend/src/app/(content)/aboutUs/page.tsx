import styles from './aboutUs.module.scss';
import TeamConstellation from "@/components/aboutus"
import { useAboutUs } from "@/hooks/aboutUs";

const AboutUs = async () => {
    const {
        nuclei,
        members
    } = await useAboutUs()

    return (
        <div className={styles.wrapper}>
            <section className={styles.hero}>
                <div className={styles.overlay}>
                    <h1>PROJETO YAWARA</h1>
                    <p className={styles.subtitle}>Inovação em Mobilidade e Transição Energética</p>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.gridTwoCols}>
                        <div>
                            <h2 className={styles.accentTitle}>A Equipe</h2>
                            <p>
                                A Equipe Yawara é uma iniciativa de pesquisa e extensão da <strong>UFGD</strong>,
                                focada no desenvolvimento de tecnologias de baixo impacto ambiental. Nosso
                                core business é a engenharia de alta performance aplicada a motores movidos a
                                <strong> Hidrogênio</strong>, unindo sustentabilidade com eficiência industrial.
                            </p>
                        </div>
                        <div className={styles.stats}>
                            <div className={styles.statItem}>
                                <span>+20</span>
                                <p>Pesquisadores envolvidos</p>
                            </div>
                            <div className={styles.statItem}>
                                <span>ODS</span>
                                <p>9 e 17 (ONU)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className={`${styles.section} ${styles.darkBg}`}>
                <div className={styles.container}>
                    <h2 className={styles.centerTitle}>Nossa Metodologia: Estrutura por Núcleos</h2>
                    <p className={styles.description}>
                        Operamos sob um modelo rigoroso de governança técnica, garantindo que cada braço do projeto
                        tenha responsabilidade clara e rastreabilidade total.
                    </p>

                    <div className={styles.artsGrid}>
                        {
                            nuclei.map((nucleus) => (
                                <div key={nucleus.id} className={styles.artCard}>
                                    <h3>{nucleus.name}</h3>
                                    <p>Total de Membros: {nucleus.total_members}</p>
                                    <p>Vagas Abertas: {nucleus.open_vacancies}</p>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.competitionBox}>
                        <h2>MotoStudent: Nosso Laboratório Global</h2>
                        <p>
                            Participamos da maior competição acadêmica de motociclismo do mundo. Não apenas para
                            correr, mas para validar tecnologias de ponta em ambientes de estresse máximo. É onde
                            a mecânica se junta com a elétrica e encontra o software em sua forma mais bruta.
                        </p>
                    </div>
                </div>
            </section>

            <section className={`${styles.section} ${styles.teamSection}`}>
                <div className={styles.container}>
                    <h2 className={styles.centerTitle}>Conselho de Fundadores</h2>
                    <div className={styles.foundersList}>
                        <span>Hélio Peres Martins Neto</span>
                        <span>Guilherme Moreira da Silva</span>
                        <span>Auanne Dias Rodrigues</span>
                        <span>Adalto Barbosa de Oliveira Neto</span>
                        <span>Eduardo Rizzi Rodrigues</span>
                        <span>Luana Beatriz Viegas Vieira</span>
                    </div>
                </div>
            </section>

            <section>
                <TeamConstellation members={members} key={'team_constellation'} />
            </section>
        </div>
    );
};

export default AboutUs;