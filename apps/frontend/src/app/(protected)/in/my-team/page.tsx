'use client';

import { useUserRole } from '@/hooks/useUserRole';
import {useMyTeam} from "@/hooks/useMyTeam"
import styles from '@/app/(protected)/in/my-team/myTeam.module.scss'

import {NewsWall} from '@/components/my-team/NewsWall';
import {TaskWall} from '@/components/my-team/TaskWall';
import {ArtGrid} from '@/components/my-team/ArtGrid';
import {ManagementActions} from '@/components/my-team/ManagementActions';

const MyTeamPage = () => {
    const {
        role, 
        isLoading, 
        user,

        arttcsGrid,
        artGrid,
        taskWall,
        newsWall,

        isLeader
    } = useMyTeam();

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
                    <ArtGrid data={artGrid} title='ART' type='ART' />
                    <ArtGrid data={arttcsGrid} title='ARTTC' type='ARTTC' />
                </section>
            </div>
        </div>
    );
};

export default MyTeamPage;