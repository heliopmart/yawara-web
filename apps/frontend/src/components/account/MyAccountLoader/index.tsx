import styles from './MyAccountLoader.module.scss';

export default function MyAccountLoader() {
  return (
    <div className={styles.container}>
      
      <div className={styles.profileCard}>
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.avatar}`} />
          <div className={styles.info}>
            <div className={`${styles.skeleton} ${styles.name}`} />
            <div className={`${styles.skeleton} ${styles.badge}`} />
          </div>
        </div>

        <div className={styles.inputsGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.inputGroup}>
              <div className={`${styles.skeleton} ${styles.label}`} />
              <div className={`${styles.skeleton} ${styles.field}`} />
            </div>
          ))}
        </div>

        <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
          <div className={`${styles.skeleton} ${styles.label}`} />
          <div className={`${styles.skeleton} ${styles.field}`} />
        </div>

        <div className={`${styles.skeleton} ${styles.button}`} />
      </div>

      <div className={styles.workSection}>
        <div className={`${styles.skeleton} ${styles.title}`} />
        
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.card}>
              <div className={styles.topRow}>
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
              </div>
              <div className={styles.midRow}>
                <div className={`${styles.skeleton} ${styles.main}`} />
                <div className={`${styles.skeleton} ${styles.sub}`} />
              </div>
              <div className={`${styles.skeleton} ${styles.botRow}`} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.settingsSection}>
        <div className={`${styles.skeleton} ${styles.title}`} />
        {[1, 2, 3].map((i) => (
           <div key={i} className={`${styles.skeleton} ${styles.row}`} />
        ))}
      </div>

    </div>
  );
}