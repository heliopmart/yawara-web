import styles from './NewsWall.module.scss'


export const NewsWall = () => {
    return (
        <div className={styles.newsWall}>
            <h3 className={styles.sectionTitle}>Mural de Notícias</h3>
            <div className={styles.newsContainer}>
                <div className={styles.newsItem}>
                    <p>Reunião geral do núcleo na próxima terça-feira.</p>
                    <small>Postado por: Helio</small>
                </div>
            </div>
        </div>
    );
};
