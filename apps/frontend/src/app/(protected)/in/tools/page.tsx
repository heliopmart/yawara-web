'use client';

import { useTools } from "@/hooks/useTools"
import styles from './tools.module.scss';

const ToolsPage = () => {
    const {
        handleSearch,
        handleAllocateTool,
        handleDeallocateTool,
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
                {!loading && filteredTools.map((tool) => (
                    <div key={tool.id} className={`${styles.toolCard} ${styles[tool.status.toLowerCase()]}`}>

                        {/* HEADER: ID e Nome */}
                        <div className={styles.cardHeader}>
                            <span className={styles.id}>{tool.id}</span>
                            <h3>{tool.name}</h3>
                        </div>

                        {/* BODY: Informações de Alocação */}
                        <div className={styles.allocationInfo}>
                            <p>STATUS: <strong>{tool.status}</strong></p>
                            <p>QUANTIDADE: <strong>{tool.quantity}</strong></p>
                            <p>VINCULO: <span>{tool.target}</span></p>
                            <p>OPERADOR: <span>
                                {
                                    tool.user_allocated?.name
                                        ? (() => {
                                            const parts = tool.user_allocated.name.split(' ');
                                            return parts.length > 1
                                                ? `${parts[0]} ${parts[1][0]}.`
                                                : parts[0];
                                        })()
                                        : 'NENHUM'
                                }
                            </span></p>
                        </div>

                        {/* DESCRIÇÃO */}
                        {tool.description && (
                            <p className={styles.description}>{tool.description}</p>
                        )}

                        {/* TIMESTAMPS: Estilo técnico para Engenharia */}
                        <div className={styles.layoutGrid} style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className={styles.timestampInfo}>
                                <span className={styles.label}>ÚLTIMO USO</span>
                                <span className={styles.value}>
                                    {tool.last_used_at ? new Date(tool.last_used_at).toLocaleDateString('pt-BR') : '--/--/--'}
                                </span>
                            </div>
                            <div className={styles.timestampInfo}>
                                <span className={styles.label}>ALOCADO EM</span>
                                <span className={styles.value}>
                                    {tool.allocated_at ? new Date(tool.allocated_at).toLocaleDateString('pt-BR') : 'DISPONÍVEL'}
                                </span>
                            </div>
                        </div>

                        {/* ACTION BUTTON */}
                        <button
                            className={styles.actionBtn}
                            onClick={() => {
                                if (tool.status === 'AVAILABLE') {
                                    handleAllocateTool(tool.id);
                                } else if (tool.user_is_owner)  {
                                    // TODO: Fazer um lable para add quantidade ou um alert.
                                    handleDeallocateTool(tool.id, tool.quantity);
                                }else{
                                    alert('Ferramenta em uso por outro usuário.');
                                }
                            }}
                        >
                            {tool.status === 'AVAILABLE' ? 'AGENDAR USO' : tool.user_is_owner ? 'DEVOLVER' : 'EM USO'}
                        </button>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default ToolsPage;