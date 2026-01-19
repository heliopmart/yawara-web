'use client';

import React, { useState } from 'react';
import styles from './tools.module.scss';

const ToolsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Mock de ferramentas e recursos
    const toolsMock = [
        { id: 'TOOL_01', name: 'Osciloscópio Digital', status: 'ALLOCATED', target: 'ART_101 (BMS)', user: 'Helio' },
        { id: 'TOOL_02', name: 'Impressora 3D V3', status: 'AVAILABLE', target: '-', user: '-' },
        { id: 'SW_01', name: 'Licença Altium Designer', status: 'ALLOCATED', target: 'ARTTC_04 (Layout)', user: 'Eng. X' },
    ];

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <span className={styles.badge}>RECURSOS TÉCNICOS</span>
                <h1>Inventário & Alocação</h1>
            </header>

            <div className={styles.searchBar}>
                <input 
                    type="text" 
                    placeholder="Filtrar por ferramenta ou ART vinculada..." 
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className={styles.toolsGrid}>
                {toolsMock.map(tool => (
                    <div key={tool.id} className={`${styles.toolCard} ${styles[tool.status.toLowerCase()]}`}>
                        <div className={styles.cardHeader}>
                            <span className={styles.id}>{tool.id}</span>
                            <h3>{tool.name}</h3>
                        </div>
                        <div className={styles.allocationInfo}>
                            <p>STATUS: <strong>{tool.status}</strong></p>
                            <p>VINCULO: <span>{tool.target}</span></p>
                            <p>OPERADOR: <span>{tool.user}</span></p>
                        </div>
                        <button className={styles.actionBtn}>
                            {tool.status === 'AVAILABLE' ? 'AGENDAR USO' : 'VER DETALHES'}
                        </button>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default ToolsPage;