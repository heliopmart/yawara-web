import { ps_card_configs, CardConfigParams } from "@yawara/types"; 

/**
 * Gera uma lista de configurações de cards mesclando um mock base com parâmetros variáveis.
 * @param configs - Uma lista de objetos com as alterações desejadas para cada card.
 */
export const generateCardConfigs = (configs: CardConfigParams[]) : Partial<ps_card_configs>[] => {

    const baseMock: Partial<ps_card_configs> = {
        limit_date: '2025-12-31 23:59:59',
        state: 'NOT_AVAILABLE',
    };

    return configs.map((config) => {
        return {
            ...baseMock, 
            ...config   
        };
    }) as Partial<ps_card_configs>[];
}