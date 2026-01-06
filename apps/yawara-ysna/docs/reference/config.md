# Configurações do Sistema

O Y-SNA é controlado por um conjunto híbrido de configurações:
1.  **Variáveis de Ambiente (.env):** Credenciais, caminhos de arquivos e chaves de API.
2.  **Banco de Dados (Tabela `system_config`):** Regras de negócio dinâmicas (ex: Modo V1/V2) que podem ser alteradas sem reiniciar o container.

## Módulo de Configuração
::: app.core.config
    options:
      heading_level: 3

::: app.services.system_configs
    options:
      heading_level: 3