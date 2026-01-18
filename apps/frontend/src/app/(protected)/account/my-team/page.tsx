'use client';

import { useUserRole } from '@/hooks/useUserRole';
import styles from '@/app/(protected)/account/my-team/myTeam.module.scss'

import {NewsWall} from '@/components/my-team/NewsWall';
import {TaskWall} from '@/components/my-team/TaskWall';
import {ArtGrid} from '@/components/my-team/ArtGrid';
import {ManagementActions} from '@/components/my-team/ManagementActions';

const MyTeamPage = () => {
    const { role, isLoading, user } = useUserRole();
    const isLeader = role === 'LEADER' || role === 'MODERATOR';

    return (
        <div className={styles.mainContainer}>
            <header className={styles.pageHeader}>
                <h1>Minha Equipe</h1>
                {isLeader && <ManagementActions />}
            </header>

            <div className={styles.contentLayout}>
                <aside className={styles.sideContent}>
                    <NewsWall />
                </aside>
                
                <section className={styles.mainContent}>
                    <TaskWall />
                    <ArtGrid title="ARTs Ativas" items={[]} type="ART" />
                    <ArtGrid title="ARTTCs" items={[]} type="ARTTC" />
                </section>
            </div>
        </div>
    );
};

export default MyTeamPage;