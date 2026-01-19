import React from 'react';
import Link from 'next/link';
import styles from './ManagementActions.module.scss'


export const ManagementActions = () => {
    return (
        <div className={styles.adminActions}>
            <Link href="/in/my-team/add/art">
                <button className={styles.primaryBtn}>+ Nova ART</button>
            </Link>
            <Link href="/in/my-team/add/arttc">
                <button className={styles.secondaryBtn}>+ Nova ARTTC</button>
            </Link>
            <Link href="/in/my-team/manage/team">
                <button className={styles.thirdBtn}>Gerenciar Time</button>
            </Link>
        </div>
    );
};
