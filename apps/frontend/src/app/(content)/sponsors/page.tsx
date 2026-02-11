
'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from './Sponsors.module.scss';
import { FaHandshake, FaLightbulb, FaTools, FaTrophy, FaBuilding, FaEnvelope, FaChevronRight } from 'react-icons/fa';

const Sponsors = () => {
  const [formData, setFormData] = useState({ name: '', company: '', email: '', message: '' });

  const tiers = [
    {
      title: "Extensão",
      icon: <FaHandshake />,
      desc: "Focado no impacto social e na formação de capital humano qualificado dentro da universidade.",
      benefit: "Certificado de Impacto Social e acesso direto ao banco de talentos da equipe."
    },
    {
      title: "Inovação",
      icon: <FaLightbulb />,
      desc: "Apoio direto ao desenvolvimento de tecnologias proprietárias como o Y-SNA e propulsão a H2.",
      benefit: "Co-branding em publicações científicas e relatórios de P&D proprietários."
    },
    {
      title: "Projeto",
      icon: <FaTools />,
      desc: "Suporte na infraestrutura, insumos e hardware necessários para a construção do protótipo.",
      benefit: "Logo master no protótipo físico e nos canais digitais do projeto."
    },
    {
      title: "Competição",
      icon: <FaTrophy />,
      desc: "Viabilização da nossa participação na MotoStudent na Espanha, levando a tecnologia brasileira ao mundo.",
      benefit: "Exposição internacional da marca e networking global no TechnoPark MotorLand."
    }
  ];

  return (
    <div className={styles.sponsorsWrapper}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.tag}>O Futuro é Sustentável</span>
          <h1>Impulsione a Próxima Geração da Engenharia</h1>
          <p>
            O Projeto Yawara é o ponto de encontro entre a excelência acadêmica da UFGD
            e as demandas reais do mercado de tecnologia limpa.
          </p>
        </div>
      </section>

      <section className={styles.about}>
        <div className={styles.container}>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutText}>
              <h2>O que é o Team Yawara?</h2>
              <p>
                Nascemos como uma iniciativa estratégica para promover a transição energética no Brasil através do Hidrogênio. Desenvolvemos tecnologias de baixo impacto ambiental aplicáveis tanto ao cenário urbano quanto ao agronegócio de alta produtividade.
              </p>
              <p>
                Atuamos sob uma gestão rigorosa por ARTs (Ações Registradas de Trabalho), garantindo que cada investimento se converta em inovação tangível, rastreabilidade técnica e formação profissional de elite.
              </p>
              <p>
                Além da engenharia de ponta, somos um agente de transformação social. Atuamos na integração de estudantes de escolas públicas e privadas, promovendo o saber científico e incentivando, por meio de palestras e eventos, o uso de tecnologias sustentáveis e disruptivas. <b>Vamos, juntos, criar a próxima geração de inovadores do Brasil e do mundo</b>
              </p>
            </div>
            <div className={styles.aboutStats}>
              <div className={styles.statCard}>
                <strong>+2028</strong>
                <span>Ano de Estreia na MotoStudent Espanha</span>
              </div>
              <div className={styles.statCard}>
                <strong>ODS</strong>
                <span>Foco em Indústria, Inovação e Parcerias</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.partnersShowcase}>
        <div className={styles.container}>
          <h2 className={styles.centerTitle}>Marcas que já acreditam em nós</h2>
          <div className={styles.logoCloud}>
            <div className={styles.logoPlaceholder}>
              <Link href={'https://www.solidworks.com/'}>SOLIDWORK</Link>
            </div>
            <div className={styles.logoPlaceholder}>
              <Link href={'http://ufgd.edu.br/'}>UFGD</Link>
            </div>
            {/* <div className={styles.logoPlaceholder}>LOGO PARCEIRO C</div> */}
          </div>
        </div>
      </section>

      <section className={styles.tiers}>
        <div className={styles.container}>
          <h2 className={styles.centerTitle}>Níveis de Parceria</h2>
          <div className={styles.tiersGrid}>
            {tiers.map(tier => (
              <div key={tier.title} className={styles.card}>
                <div className={styles.cardIcon}>{tier.icon}</div>
                <h3>{tier.title}</h3>
                <p>{tier.desc}</p>
                <div className={styles.benefitBox}>
                  <strong>Diferencial:</strong> {tier.benefit}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cta} id='be'>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <div className={styles.ctaText}>
              <h2>Vamos construir o legado Yawara juntos?</h2>
              <p>
                Ao patrocinar o Yawara, sua empresa não apenas expõe a marca, mas investe
                diretamente na redução da lacuna tecnológica brasileira em energias limpas.
              </p>
              <ul className={styles.checkList}>
                <li>Acesso a talentos de Engenharia ( Da Academia para o Mercado )</li>
                <li>Marketing em uma competição global de engenharia</li>
                <li>Contribuição com os Objetivos de Desenvolvimento Sustentável (ODS)</li>
                <li>Partipação das nossas ações sociais de extensão.</li>
              </ul>
            </div>
            <div className={styles.ctaForm}>
              <form>
                <input type="text" placeholder="Seu Nome ou Empresa" required />
                <input type="email" placeholder="E-mail para Contato" required />
                <textarea placeholder="Fale brevemente sobre o interesse da sua empresa no projeto..." rows={5}></textarea>
                <button type="submit">Solicitar Apresentação Comercial <FaChevronRight /></button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sponsors;