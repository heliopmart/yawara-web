import React from 'react';
import Link from 'next/link';
import styles from './dynamicAlertCard.module.scss';

interface DynamicAlertCardProps {
    title: string;
    message: string;
    buttonText: string;
    buttonLink: string;
    statusColor: "default" | "warning" | "success";
}

const DynamicAlertCard: React.FC<DynamicAlertCardProps> = ({
    title,
    message,
    buttonText,
    buttonLink,
    statusColor,
}) => {
    
    const cardClass = styles[statusColor];

    return (
        <div className={`${styles.cardContainer} ${cardClass}`}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.message}>{message}</p>
            
            {buttonText && (
                <Link href={buttonLink} className={styles.actionButton}>
                    {buttonText.toUpperCase()}
                </Link>
            )}
        </div>
    );
};

export default DynamicAlertCard;