# Relatório Detalhado de Processos de Negócio e Funcionalidades (BP) - COZINHA+

Este relatório técnico-operacional descreve **a realidade sistêmica** do software COZINHA+, baseado inteiramente no código-fonte em produção (Frontend React e Backend Node/Prisma). O sistema é um ERP unificado (Backoffice + Operação + PDV), projetado com a premissa de multi-tenancy rígido e alta rastreabilidade (Audit Log).

Abaixo estão detalhados os módulos ativos e as funcionalidades presentes tela a tela.

---

## 1. Autenticação, Segurança e Auditoria

O sistema é construído sobre validação forte de identidade e isolamento de informações.

*   **Login & Reset (`Login.tsx`, `ResetPassword.tsx`):**
    *   Controle de sessão via JWT, separando instâncias de sessão por Filial (`activeBranch`).
    *   Gestão de segurança contra ataques de força bruta (bloqueio temporário após limite de erros implementado no `authController.ts`).
    *   Perfis de Acesso (RBAC) que definem a renderização dos componentes (Admin, Gestor, Estoquista, Cozinheiro, Visualização).
*   **Gestão de Usuários (`Users.tsx`):**
    *   Administração centralizada de credenciais. Permite vincular um usuário a filiais específicas. Suporta *soft delete* (desativação sem perda de histórico).
*   **Log de Auditoria (`AuditLog.tsx` / `AuditController.ts`):**
    *   Funcionalidade passiva em todo o sistema. Toda ação de escrita (POST, PUT, DELETE) é interceptada pelo backend, que grava no banco: usuário, tabela afetada, id, e o *diff* JSON (o que mudou). A interface permite ao gestor rastrear exatamente quem fez qualquer alteração no sistema.

---

## 2. Configurações Globais e Backoffice Estrutural

Módulo administrativo utilizado pela gestão corporativa (Matriz) e gestão local.

*   **Configurações da Empresa (`CompanySettings.tsx`):**
    *   Painel restrito ao Administrador para atualizar logo, CNPJ, fuso horário e métricas globais, além de configurar dias de antecedência para os alertas de validade de lotes.
*   **Gestão de Filiais (`Branches.tsx`):**
    *   Módulo de expansão de rede. Criação de filiais independentes. Os dados de cada filial ficam ilhados via middleware (`branchGuard.ts`), mas os cadastros mestres (Produtos, Fornecedores) são centralizados.
*   **Estrutura de Armazenamento (`Locations.tsx`) e Categorias (`Categories.tsx`):**
    *   Criação do mapa físico da filial (Câmaras, Estoque Seco, Geladeiras). `Location` pode carregar definições de limite térmico. As `Categories` agrupam os itens para visualização analítica (Ex: ABC).
*   **Parâmetros Financeiros (`FinanceSettings.tsx`):**
    *   Tela para cadastro de Centros de Custo (Ex: RH, Insumos, Manutenção) e Tipos de Despesa.

---

## 3. Catálogo de Produtos e Fornecedores (Master Data)

Onde reside a inteligência de compras e fiscal.

*   **Fornecedores (`Suppliers.tsx`):**
    *   Cadastro com CNPJ, Condições de Pagamento e Prazo de Entrega, formando um dossiê comercial do parceiro.
*   **Produtos (`Products.tsx`):**
    *   Interface com navegação por abas. Consolida dezenas de informações vitais:
        *   **Comercial e Fiscal:** EAN, NCM, SIF (ANVISA).
        *   **Operacional:** Unidade de medida, Temperatura Min/Max exigida.
        *   **Estoque:** Quantidades Críticas (Mínimo / Máximo) para reposição automática.
*   **Raio-X do Produto (`ProductDetail.tsx`):**
    *   Uma das funcionalidades mais potentes. Um dashboard de um único item mostrando:
        *   Saldo atual distribuído pelos locais de armazenamento.
        *   Gráfico financeiro com variação do preço pago nos últimos meses.
        *   Timeline das últimas movimentações.
        *   Lotes em atividade vinculados àquele EAN.

---

## 4. Entrada de Mercadoria (Recebimento)

Bloqueio primário contra desvios de compra e contaminações.

*   **Lista de Recebimentos (`ReceivingList.tsx`):**
    *   Mural que exibe o histórico de entrada, números de NFs e os status (Aguardando Conferência, Concluído, Em Divergência).
*   **Fluxo de Conferência Cega (`ReceivingFlow.tsx`):**
    *   O motor de recebimento. O colaborador visualiza os itens da nota, mas não vê as quantidades pedidas.
    *   **Funcionalidades:** Coleta manual da quantidade real (com suporte a decimais), data de validade da mercadoria e a temperatura de desembarque.
    *   **Geração de Lote e Qualidade:** Itens que recebem aprovação dão entrada imediata no `StockBalance` e geram um `Lot`. Divergências (temperatura fora do range ou faltas) congelam o item e notificam o gestor (que aprova a exceção ou devolve ao fornecedor).

---

## 5. Controle de Estoque e Rastreabilidade (O Chão de Fábrica)

Monitoramento em tempo real do movimento físico.

*   **Estoque em Tempo Real (`Stock.tsx`):**
    *   Visão consolidada com barras de progresso comparando o estoque atual com o Mínimo/Máximo estabelecidos.
    *   Filtros nativos por local de armazenagem, itens abaixo do mínimo e itens de manipulação controlada.
*   **Movimentação Manual (`StockMovement.tsx`):**
    *   Ajustes rápidos de adição ou remoção de insumos sem NF. Requerem sempre uma justificativa gravada em log.
*   **Transferência Entre Filiais (`Transfers.tsx`):**
    *   Reduz saldo de uma filial e gera entrada automática no trânsito de outra unidade (`originBranchId` -> `destinationBranchId`).
*   **Geração de Etiquetas Sanitárias (`Labels.tsx`):**
    *   Emissão customizada para impressoras térmicas contendo Data de Validade, Lote, SIF, e um QR Code. Na vida real da cozinha, o QR Code pode ser lido (com app ou webcam) para exibir o prontuário do produto processado, garantindo rastreio ANVISA.

---

## 6. Central de Qualidade e Desperdício

*   **Semáforo de Validades (`Expirations.tsx`):**
    *   O motor de qualidade do sistema (`lotController.ts`) agrupa lotes abertos ordenando-os pela data de perecimento, criando clusters (Hoje, Próximos 7 dias). Status mudam automaticamente de "Normal" para "Vencido".
*   **Painel de Baixas / Perdas (`Losses.tsx`):**
    *   Registro disciplinado de quebra. A baixa desconta do saldo físico, exige um motivo auditável (Vencimento, Erro de Produção, Acidente) e opcionalmente uma foto do descarte, visando travar o vazamento financeiro.

---

## 7. Fichas Técnicas e Produção

Módulo responsável pela transformação de matéria-prima.

*   **Fichas Técnicas / Receitas (`Recipes.tsx`):**
    *   Estruturação de Engenharia de Cardápio. Composição das proporções de ingredientes necessários para atingir o rendimento planejado de um pré-preparo (Ex: Massa Mãe, Molho Base).
*   **Ordem de Produção (`Production.tsx`):**
    *   Execução da Ficha Técnica. O cozinheiro diz: "Planejei fazer 10Kg, mas após desossar, renderam apenas 8.5Kg". O sistema calcula a **Porcentagem de Rendimento (Yield %)** e dá a baixa sistêmica (desconto FIFO nos ingredientes do Lote mais antigo).

---

## 8. Fechamento de Vendas e Inventário

*   **Frente de Caixa Simples (`PDV.tsx`):**
    *   Módulo para atendimento balcão. Venda rápida de produtos finais, seleção de método de pagamento.
    *   **Inteligência Dinâmica:** A venda aciona o Controller que entende: Se o item vendido tiver uma "Recipe" (Ficha Técnica), ele baixa os ingredientes proporcionais; se não, baixa a unidade inteira (Ex: Refrigerante).
*   **Contagem de Estoque Cega (`Inventory.tsx`):**
    *   Uma sessão aberta de balanço de loja. O estoquista informa o saldo físico apurado. O sistema computa a variância (Sobras e Faltas) frente ao Estoque Teórico e retém a alteração para aprovação do supervisor, forçando conformidade com o saldo novo e registrando em `InventoryItem`.

---

## 9. Despesas, BI e Visão Corporativa (A Inteligência do Negócio)

*   **Notas e Despesas Gerais (`Invoices.tsx`):**
    *   Inclusão de todas as despesas da loja (luz, aluguel, compra de insumos não-automatizada). Agrupa por fornecedor e rateia em Centros de Custo (`costCenterId`), servindo de base contábil DRE para o CMV.
*   **Sugestão de Compras (`PurchaseSuggestion.tsx`):**
    *   A partir dos gatilhos de Estoque Mínimo/Máximo cadastrados em Produto e da visão diária, o sistema cria uma lista automatizada para o comprador contendo: "Faltam X pacotes do EAN Y", vinculando ao principal fornecedor e estimando o custo da encomenda.
*   **Relatórios Avançados e Curva ABC (`Reports.tsx`):**
    *   O painel de BI com multi-abas (Validades, Produções, Perdas).
    *   **Filtro Multi-Unidades:** Permite ao Admin alternar entre os dados da sua filial atual e o consolidado (`allBranches`) da empresa inteira (onde entra em cena a proteção de vazamento via filtro `companyId`).
    *   **Snapshot de CMV:** Todo mês, o sistema tira "fotos" (`StockSnapshot`) do valor monetário estacionado em estoque, possibilitando confrontar com o Faturamento do PDV para encontrar a % real de Custo da Mercadoria Vendida (CMV).
    *   **Curva ABC:** Tabela ranqueada automaticamente pelo backend `getAbcCurve` que isola os 20% de itens que representam 80% do dinheiro parado na prateleira, orientando a gestão a comprar com inteligência.
*   **Dashboard Executivo (`Dashboard.tsx`):**
    *   Ponto de partida do sistema. Reúne Indicadores (KPIs) financeiros, gráficos de pizza (por centros de custo/categorias), botões de ação rápida e notificações emergenciais (Alertas Clicáveis) levando o usuário diretamente ao gargalo operacional.
