import { useState, useEffect } from 'react';

// --- Interfaces de Governança Técnica ---
export interface ARTTCCReport {
  nome: string;
  link: string;
  dataEntrega?: string;
}

export interface ARTTC {
  id: string;
  meta: string;
  responsavel: string;
  linkFile: string; // Arquivo da meta (ex: código, simulação)
  report?: ARTTCCReport; // Report final (opcional até a conclusão)
}

export interface ART {
  id: string;
  titulo: string;
  linkFile: string; // Documento principal do projeto/ART [cite: 99]
  status: 'Em Planejamento' | 'Execução' | 'Concluída' | 'Atrasada';
  arttcs: ARTTC[];
}

export interface Nucleo {
  nome: string;
  arts: ART[];
}

// --- Interfaces de Gestão Operacional e Financeira ---
export interface ItemInventario {
  id: string;
  nome: string;
  comQuem: string; // Rastreabilidade do ativo
  status: 'Operacional' | 'Em Manutenção' | 'Necessita Calibração' | 'Em Aquisição';
  ultimaManutencao: string;
  proximaRevisao?: string;
}

export interface MovimentacaoFinanceira {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'Entrada' | 'Saída';
  categoria: string; // Editais, Patrocínio, Insumos [cite: 139]
  data: string;
}

export const useTransparency = () => {
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [financeiro, setFinanceiro] = useState({
    saldo: 0,
    historico: [] as MovimentacaoFinanceira[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Quando seu backend estiver pronto, descomente a linha abaixo:
        // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transparency/dashboard`);
        // const data = await response.json();

        // --- Mock de Dados Baseado na Estrutura Yawara ---
        
        // 1. Governança por Núcleos [cite: 41, 102]
        setNucleos([
          {
            nome: "Núcleo de Engenharia e Desenvolvimento",
            arts: [
              {
                id: "ART-ENG-001",
                titulo: "Desenvolvimento do Sistema de Admissão Neural (Y-SNA)",
                linkFile: "/downloads/art_001_projeto.pdf",
                status: "Execução",
                arttcs: [
                  {
                    id: "ARTTC-01",
                    meta: "Modelagem da Rede Neural de Admissão",
                    responsavel: "Helio Peres",
                    linkFile: "/downloads/arttc_01_modelagem.zip",
                    report: {
                      nome: "Relatório de Acurácia V1",
                      link: "/downloads/report_01_final.pdf",
                      dataEntrega: "20/01/2026"
                    }
                  },
                  {
                    id: "ARTTC-02",
                    meta: "Integração Firmware/Hardware (ECU)",
                    responsavel: "Eduardo Rizzi",
                    linkFile: "/downloads/arttc_02_firmware.c",
                    // Report ainda não gerado (Pendente)
                  }
                ]
              }
            ]
          },
          {
            nome: "Núcleo de Gestão e Captação",
            arts: [
              {
                id: "ART-GES-002",
                titulo: "Captação de Recursos e Editais 2026",
                linkFile: "/downloads/art_002_gestao.pdf",
                status: "Em Planejamento",
                arttcs: [
                  {
                    id: "ARTTC-01",
                    meta: "Submissão Edital FINEP",
                    responsavel: "Adalto Barbosa",
                    linkFile: "/downloads/projeto_finep.pdf"
                  }
                ]
              }
            ]
          }
        ]);

        // 2. Inventário em Tempo Real
        setInventario([
          { 
            id: "INV-001", 
            nome: "Analisador de Espectro", 
            comQuem: "Lab Elétrica", 
            status: "Operacional", 
            ultimaManutencao: "10/12/2025" 
          },
          { 
            id: "INV-042", 
            nome: "Bancada de Teste Hidrogênio", 
            comQuem: "Oficina Mecânica", 
            status: "Em Aquisição", 
            ultimaManutencao: "15/01/2026",
            proximaRevisao: "30/01/2026"
          }
        ]);

        // 3. Financeiro
        setFinanceiro({
          saldo: 3000,
          historico: [
            { id: "M-01", descricao: "Submissão Edital Interno da UFGD ", valor: 3000, tipo: "Entrada", categoria: "Publico", data: "10/07/2025" },
          ]
        });

        setLoading(false);
      } catch (error) {
        console.error("Falha ao sincronizar dados do Hub:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { nucleos, inventario, financeiro, loading };
};