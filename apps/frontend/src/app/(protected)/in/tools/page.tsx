'use client';

import {useTools} from "@/hooks/useTools"
import styles from './tools.module.scss';

const ToolsPage = () => {
    const {
        handleSearch,
        handleAllocateTool,
        filteredTools,
        loading,
        search
    } = useTools();

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <span className={styles.badge}>RECURSOS TÉCNICOS</span>
                <h1>Inventário & Alocação</h1>
            </header>

            <div className={styles.searchBar}>
                <input 
                    type="text" 
                    value={search}
                    placeholder="Filtrar por ferramenta ou ART vinculada..." 
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            <div className={styles.toolsGrid}>
                {!loading && filteredTools.map(tool => (
                    <div key={tool.id} className={`${styles.toolCard} ${styles[tool.status.toLowerCase()]}`}>
                        <div className={styles.cardHeader}>
                            <span className={styles.id}>{tool.id}</span>
                            <h3>{tool.name}</h3>
                        </div>
                        <div className={styles.allocationInfo}>
                            <p>STATUS: <strong>{tool.status}</strong></p>
                            <p>VINCULO: <span>{tool.target}</span></p>
                            <p>OPERADOR: <span>{tool.allocated_to.name}</span></p>
                        </div>
                        <button className={styles.actionBtn} onClick={() => {
                            if (tool.status === 'AVAILABLE') {
                                handleAllocateTool(tool.id);
                            }
                        }}>
                            {tool.status === 'AVAILABLE' ? 'AGENDAR USO' : 'VER DETALHES'}
                        </button>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default ToolsPage;