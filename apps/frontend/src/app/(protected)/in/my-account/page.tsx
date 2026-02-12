'use client';

import styles from './my-account.module.scss';
import Link from 'next/link';
import {
  FaUserEdit, FaDownload, FaRobot, FaPowerOff, FaUserSlash, FaFileAlt, FaExternalLinkAlt
} from 'react-icons/fa';
import { useMyAccount } from '@/hooks/useMyAccount';
import MyAccountLoader from "@/components/account/MyAccountLoader";

export default function MyAccountPage() {
  const {
    user,
    workItems,
    isEditing,
    loading,
    signatureToken,
    isGenerating,
    generateSignature,
    handleUpdateInformation,
    handleInputChange,
    handleDownloadData,
    handleDangerAction
  } = useMyAccount()


  if (loading || !user) {
    return (
      <MyAccountLoader />
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>

        <section className={styles.profileSection}>
          <div className={styles.header}>
            <div className={styles.avatar}>{user?.initials}</div>
            <div className={styles.info}>
              <h1>{user.name}</h1>
              <span className={styles.nucleusBadge}>{user?.nucleus?.name}</span>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Nome Completo</label>
              <input
                type="text"
                name="name"
                placeholder='Nome'
                value={user.name ?? ""}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className={styles.field}>
              <label>E-mail Institucional</label>
              <input
                type="email"
                name="email"
                value={user?.auth?.email ?? ""}
                disabled
                title="E-mail não pode ser alterado"
              />
            </div>
            <div className={styles.field}>
              <label>Telefone / WhatsApp</label>
              <input
                type="tel"
                placeholder='Telefone/Whatsapp'
                name="phone"
                value={user?.phone ?? ""}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className={`${styles.field} ${styles.notificationGroup}`}>
              <label htmlFor='wpa_enabled'>Notificações</label>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  id='wpa_enabled'
                  name="wpa_enabled"
                  checked={user?.wpa_enabled ?? false}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                <span className={`${styles.slider} ${styles.round}`}></span>
              </label>
            </div>
            <div className={styles.field}>
              <label>Núcleo Alocado</label>
              <input
                type="text"
                placeholder='Núcleo Alocado'
                value={user?.nucleus?.name ? user.nucleus.name : ""}
                disabled
                style={{ opacity: 0.5 }}
              />
            </div>
          </div>

          <button
            className={styles.editBtn}
            onClick={() => handleUpdateInformation()}
          >
            {isEditing ? 'Salvar Alterações' : <><FaUserEdit style={{ marginRight: 8 }} /> Editar Perfil</>}
          </button>
        </section>

        <section className={styles.workSection}>
          <h2>Trabalhando em</h2>
          <div className={styles.cardsGrid}>
            {workItems?.map((item) => (
              <div key={item.id} className={styles.workCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.type}>{item.type} • {item.code} {item.role && `• ${item.role}`} </span>

                  <span className={styles.status} style={{ color: item.status === 'FINALIZED' ? '#888' : '#4caf50' }}>
                    {item.status}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>Vinculado ao {user.nucleus.name}</p>

                <div className={styles.cardFooter}>
                  <Link href={`/in/my-team/manage/${item.type.toLowerCase()}/${item.original_id}`} className={styles.detailsBtn}>
                    <button>
                      <FaExternalLinkAlt /> Ver Detalhes
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.settingsSection}>
          <h2>Dados e Privacidade</h2>

          <div className={styles.actionsList}>
            <div className={styles.actionRow}>
              <div className={styles.actionInfo}>
                <h4>Assinatura de Documentos (ART/ARTTC)</h4>
                <p>Gere um token de autenticidade para os modelos de Word.</p>

                {signatureToken && (
                  <div className={styles.signatureBox}>
                    <code>{signatureToken}</code>
                    <button
                      className={styles.copyBtn}
                      onClick={() => navigator.clipboard.writeText(signatureToken)}
                    >
                      Copiar
                    </button>
                  </div>
                )}
              </div>
              <button onClick={generateSignature} disabled={isGenerating}>
                <FaFileAlt /> {signatureToken ? 'Regerar Token' : 'Gerar Assinatura'}
              </button>
            </div>

            <div className={styles.actionRow}>
              <div className={styles.actionInfo}>
                <h4>Baixar meus dados</h4>
                <p>Receba um arquivo com todo seu histórico no sistema.</p>
              </div>
              <button onClick={() => handleDownloadData('general')}>
                <FaDownload /> Solicitar Arquivo
              </button>
            </div>

            <div className={styles.actionRow}>
              <div className={styles.actionInfo}>
                <h4>Dados de Treinamento IA</h4>
                <p>Baixar cópia dos históricos enviados para a Rede Neural.</p>
              </div>
              <button onClick={() => handleDownloadData('ai')}>
                <FaRobot /> Baixar Dataset
              </button>
            </div>

            <div className={styles.actionRow}>
              <div className={styles.actionInfo}>
                <h4>Desativar Conta</h4>
                <p>Sua conta ficará oculta mas os dados serão mantidos.</p>
              </div>
              <button className={styles.danger} onClick={() => handleDangerAction('deactivate')}>
                <FaPowerOff /> Desativar
              </button>
            </div>

            <div className={styles.actionRow}>
              <div className={styles.actionInfo}>
                <h4 style={{ color: '#ef5350' }}>Requisitar Desligamento</h4>
                <p>Solicitar saída oficial do projeto e exclusão de acessos.</p>
              </div>
              <button className={styles.danger} onClick={() => handleDangerAction('quit')}>
                <FaUserSlash /> Pedir Desligamento
              </button>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}