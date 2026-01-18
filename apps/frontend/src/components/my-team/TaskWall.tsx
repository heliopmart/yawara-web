import React from 'react';
import styles from './TaskWall.module.scss'


export const TaskWall = () => {
    const tasks = [
        { id: 1, title: 'Refinar CAD da suspensão', status: 'DOING', priority: 'HIGH' },
        { id: 2, title: 'Código do sensor de pressão', status: 'TODO', priority: 'MEDIUM' }
    ];

    return (
        <div className={styles.sectionWrapper}>
            <h3 className={styles.sectionTitle}>Tarefas do Núcleo</h3>
            <div className={styles.taskContainer}>
                {tasks.map(task => (
                    <div key={task.id} className={styles.taskCard}>
                        <div className={`${styles.priorityDot} ${styles[task.priority.toLowerCase()]}`} />
                        <span className={styles.taskTitle}>{task.title}</span>
                        <span className={styles.statusBadge}>{task.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
