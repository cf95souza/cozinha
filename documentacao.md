# Documentação: COZINHA+

## Escopo do Projeto
O COZINHA+ é um sistema de gestão operacional exclusivo para cozinhas profissionais. O objetivo é centralizar e registrar atividades como recebimento, conferência, estoque, lotes, validades, etiquetas, inventário e produção. Deve ser **mobile first**, de uso simplificado, seguindo o lema: "Poucos cliques, pouca digitação e máximo controle".

## Regras de Negócio
1. **Rastreabilidade**: O sistema acompanha o produto desde a entrada (fornecedor) até a saída/perda.
2. **Perfis de Usuário**:
   - Administrador: Acesso completo.
   - Gestor: Acesso de gestão e dashboards, não altera config crítica.
   - Estoquista: Operacional de recebimento, conferência, estoque, etiquetas.
   - Cozinheiro: Consulta de validade, QR code, registro de produção e perda.
   - Visualização: Apenas consulta.
3. **Validades**: Cálculo automático de status (Normal, Atenção, Urgente, Vencido).
4. **Conferência**: Exige aprovação de recebimento, gerando alertas automáticos em caso de divergência de quantidade, temperatura ou validade.
5. **Movimentação**: Nenhuma alteração de estoque é silenciosa. Toda movimentação gera registro (auditoria).
6. **Isolamento de Estoque por Localidade**: O estoque de matriz e filiais não se misturam. A transferência de produtos entre elas gera uma Movimentação de Estoque e rastreabilidade.

## Decisões Técnicas
- **Plataforma**: Web Application (Mobile First).
- **Deploy**: Docker / VPS.
- **Backend/Frontend**: Node.js com Express e Prisma (Backend) / React com Vite e TailwindCSS (Frontend).
- **Segurança**: Validação estrita server-side, sem exposição de dados sensíveis. Nenhuma lógica de segurança apenas no frontend.
- **Banco de Dados (IMPORTANTE)**: **PROIBIDO** o uso de comandos que resetam o banco de dados (ex: `npx prisma migrate reset` ou `npx prisma migrate dev` quando destrói dados). O ambiente atual já possui dados de teste de localidades e estoque inseridos pelo usuário. Qualquer alteração de Schema daqui pra frente deve preservar os dados existentes.

## Evolução do Sistema

### Evolução do Sistema (Histórico de Fases Concluídas)

1. **Fase 1 (MVP de Estrutura e Rotas):** [...]
2. **Fase 2 (Layout, Navegação e Autenticação UI):** [...]
3. **Fase 3 (Telas de Cadastros Básicos):** [...]
4. **Fase 4 (Movimentação de Estoque & Recebimentos):** [...]
5. **Fase 5 (Gestão de Validades e Etiquetas):** [...]
6. **Fase 6 (Produção e Fichas Técnicas):** [...]
7. **Fase 7 (Multi-Tenancy, Segurança & Soft Delete):** 
   - Middleware `branchGuard.ts` e Injeção de Contexto JWT para filiais.
   - Schemas Zod Server-Side em rotas Críticas.
   - Campo `status` (ATIVO/INATIVO) adicionado aos modelos e ajustado nos list endpoints.
8. **Fase 8 (Enriquecimento de Cadastros (Business & Ops)):**
   - Atualizados os modelos `Company`, `Branch`, `Product`, `Supplier` e `Location` no Prisma, com foco em dados reais do backoffice, notas fiscais, EAN e NCM.
   - Refatoração dos Formulários do Frontend, adicionando abas de dados no modal de Produto (Básicos, Comercial & Fiscal, Especificações Técnicas, Estoque, Regras).
   - Separação da tela `CompanySettings` para configurações globais, com a criação da nova tela `Branches.tsx` (Unidades) para gerenciar filiais individualmente.
   - Backend Controllers atualizados para extrair todos os novos campos nas mutações.
9. **Fase 9 (Evolução dos Módulos Existentes):**
   - Reescrita completa da tela de Estoque com filtros avançados, agrupamento, valor estimado e integração visual de lotes.
   - Relatórios aprimorados e com possibilidade de novas visualizações de dados.
10. **Fase 10 (Funcionalidades Novas e Premium):**
    - Criação de Raio-X do Produto (ProductDetail), Sugestão Automática de Compra, e Cálculo de CMV (com `StockSnapshot`).
    - Alertas Clicáveis integrados ao Dashboard.
    - Modo Escuro integrado (Toggle no frontend via css classes).
    - Configurações estendidas para Empresa.
11. **Fase 11 (Polimento e Experiência Premium):**
    - Implementação base de paginação (Client-Side e Server-Side com Prisma `skip`/`take`), incluindo metadados `{ total, page, limit, totalPages }`.
    - Componentes de UI `Pagination.tsx`, `LoadingSkeleton.tsx` e `EmptyState.tsx`.
    - `react-hot-toast` substituindo `alert()` nativo em formulários e ações de sistema (ex: Suppliers, Products, Categories, Locations, AuditLog).

## Histórico de Alterações
- **22/08/2026**: Evolução para M-023, M-024 e M-025, integrando UI states premium (Skeletons, Empty States) e paginação completa. Documentação atualizada (M-026).
