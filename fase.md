# Fases do Projeto: COZINHA+

## Status Geral: MVP Funcional — Em Evolução para Produto Profissional

Este documento é o guia definitivo de execução do projeto. Cada funcionalidade possui referência ao **`MVP.md`** (regras de negócio) e ao **`MELHORIAS.md`** (instruções técnicas detalhadas de cada melhoria).

> **Como usar:** Cada item marcado com `(Ref: MELHORIAS.md - M-XXX)` possui instruções completas no documento de melhorias. Se precisar parar no meio de uma tarefa, basta anotar o ID da melhoria (ex: M-007) e, ao retomar, abrir `MELHORIAS.md` na seção correspondente para saber exatamente o que já existe, o que falta e quais arquivos são afetados.

---

### Fase 0: Planejamento, Arquitetura e Infraestrutura ✅
- [x] Leitura do MVP
- [x] Inicialização dos arquivos de controle (`fase.md`, `documentacao.md`, `database.md`)
- [x] Execução das skills de validação (Security, Product Manager, PRP, Architecture)
- [x] Configuração do repositório (Monorepo: React/Vite no Frontend, Express/Node.js no Backend)
- [x] Configuração do Docker (Orquestração de 3 contêineres: Web, API, PostgreSQL)
- [x] Configuração do Prisma ORM e Schema inicial gerado (Ref: `MVP.md` - Seção 42)

---

### Fase 1: Autenticação, Perfis e Cadastros Base ✅
**Objetivo:** Fundação do sistema — login, usuários e dados mestres.

- [x] **Autenticação e Login** (Ref: `MVP.md` - Seções 3 e 4)
  - [x] Tela de Login e recuperação de senha.
  - [x] Gestão de Perfis: Administrador, Gestor, Estoquista, Cozinheiro, Visualização.
- [x] **Cadastro de Empresas e Unidades** (Ref: `MVP.md` - Seção 42)
- [x] **Gestão de Usuários** (Ref: `MVP.md` - Seções 3 e 42)
- [x] **Cadastro de Produtos** (Ref: `MVP.md` - Seções 7 e 25)
  - [x] Campos de estoque mínimo/máximo, temperatura controlada, e produto "Controlado".
- [x] **Unidades de Medida e Categorias** (Ref: `MVP.md` - Seções 8 e 9)
- [x] **Locais de Armazenamento** (Ref: `MVP.md` - Seção 10)
- [x] **Fornecedores** (Ref: `MVP.md` - Seção 33)

---

### Fase 2: Recebimento, Conferência e Validades ✅
**Objetivo:** Fluxo de entrada de mercadorias — coração da rastreabilidade.

- [x] **Fluxo de Novo Recebimento** (Ref: `MVP.md` - Seção 11 e 12)
  - [x] Cadastro de notas, anexação de fotos da nota e embalagem (Ref: `MVP.md` - Seção 16).
- [x] **Conferência Visual e Automática** (Ref: `MVP.md` - Seções 13, 14 e 15)
  - [x] Aprovação, recusa, aprovação com ressalva.
  - [x] Alertas de divergência de quantidade e temperatura fora do padrão.
- [x] **Geração e Rastreabilidade de Lotes** (Ref: `MVP.md` - Seção 17)
  - [x] Todo produto aprovado que exigir rastreabilidade ganha um lote.
- [x] **Central de Validades** (Ref: `MVP.md` - Seções 18 e 19)
  - [x] Cálculo automático de status (Normal, Atenção, Urgente, Vencido).
  - [x] Tela de filtro por vencimento (Hoje, Amanhã, Próximos 7 dias).

---

### Fase 3: Movimentação, Estoque e Etiquetas ✅
**Objetivo:** Circulação física rastreada, QR Codes e contagem.

- [x] **Geração de Etiquetas e QR Code** (Ref: `MVP.md` - Seções 20 e 21)
  - [x] Impressão de etiqueta com dados do Lote e Validade.
  - [x] Leitura do QR Code exibindo ficha completa e status do produto.
- [x] **Movimentação e Transferência** (Ref: `MVP.md` - Seções 22 e 23)
  - [x] Registro de transferências entre câmaras/prateleiras (Origem -> Destino).
- [x] **Controle de Perdas / Descarte** (Ref: `MVP.md` - Seção 30)
  - [x] Registro de perda com foto e motivos (Vencimento, Quebra, etc.).
- [x] **Inventário e Contagem de Estoque** (Ref: `MVP.md` - Seções 26 a 29)
  - [x] Módulo de contagem às cegas, divergência automática e aprovação de ajuste pelo Gestor.

---

### Fase 4: Dashboard, Relatórios e Auditoria ✅
**Objetivo:** Visão consolidada para o gestor e segurança através de logs.

- [x] **Dashboard do Gestor** (Ref: `MVP.md` - Seções 5 e 40)
  - [x] Indicadores de valor de estoque, produtos a vencer, alertas críticos.
  - [x] Tela de Ação Rápida (Receber, Etiquetar, Contar, Perda) (Ref: `MVP.md` - Seção 40).
- [x] **Relatórios Base** (Ref: `MVP.md` - Seção 35)
  - [x] Estoque atual, Movimentações, Divergências, Vencidos.
- [x] **Módulo de Auditoria (Audit Log)** (Ref: `MVP.md` - Seção 36)
  - [x] Registro inalterável de quem, quando e o que foi alterado.
- [x] **Notificações In-App** (Ref: `MVP.md` - Seção 37)
  - [x] Alertas dinâmicos no sistema para produtos vencidos ou no estoque mínimo.
- [x] **Busca Global Rápida** (Ref: `MVP.md` - Seção 38)

---

### Fase 5: Produção e Fichas Técnicas ✅
**Objetivo:** Módulo de transformação — o que a cozinha produz. (Ref: `MVP.md` - Seção 45)

- [x] **Módulo de Produção Simplificado** (Ref: `MVP.md` - Seção 31)
  - [x] Registro do que foi produzido e tempo gasto.
- [x] **Fichas Técnicas e Rendimento** (Ref: `MVP.md` - Seção 32)
  - [x] Cálculo de % de rendimento (Planejado vs Real).
- [~] **Avaliação e Ranking de Fornecedores** (Ref: `MVP.md` - Seção 34) - *Cancelado/Adiado*
- [~] **Notificações Externas** (WhatsApp e E-mail) - *Cancelado/Adiado*

---

## ════════════════════════════════════════
## EVOLUÇÃO PÓS-MVP — PRODUTO PROFISSIONAL
## ════════════════════════════════════════

---

### Fase 7: Segurança e Estabilidade (Pré-Requisito para Produção) ✅
**Objetivo:** Corrigir falhas estruturais antes de entregar para o cliente. Sem esta fase, o sistema NÃO deve ir para produção.

- [x] **Blindagem de Acesso por Filial** (Ref: `MELHORIAS.md` - M-001)
  - [x] Incluir `branchId` no JWT.
  - [x] Criar middleware `branchGuard.ts` que valida acesso do usuário à filial.
  - [x] Aplicar o guard em todas as rotas.
- [x] **Validação Server-Side com Zod** (Ref: `MELHORIAS.md` - M-002)
  - [x] Criar pasta `schemas/` com validações para cada entidade.
  - [x] Aplicar nos controllers de escrita (POST/PUT).
- [x] **Soft Delete Global** (Ref: `MELHORIAS.md` - M-003)
  - [x] Adicionar campo `status` (ATIVO/INATIVO) em Product, Supplier, Category, Location, User.
  - [x] Substituir `delete()` por `update({ status: INATIVO })` em todos os controllers.
  - [x] Filtrar `{ status: ATIVO }` em todas as listagens por padrão.
- [x] **Proteção do Endpoint Seed** (Ref: `MELHORIAS.md` - M-004)
  - [x] Proteger com variável de ambiente ou desabilitar em produção.

---

### Fase 9: Evolução dos Módulos Existentes (Subir de Nível) - [CONCLUÍDA]
**Objetivo:** Reescrever os módulos que estão em nível de protótipo para nível de produto premium.

- [x] **Tela de Estoque — Reescrita Completa** (Ref: `MELHORIAS.md` - M-010)
  - [x] Barra de busca por nome de produto.
  - [x] Filtros: Categoria, Local, Abaixo do Mínimo, Controlados.
  - [x] Indicador visual de nível (barra de progresso colorida Min/Atual/Max).
  - [x] Agrupamento colapsável por Local de Armazenamento.
  - [x] Coluna de Valor Estimado (Qtd × Custo) e Status do Lote.
  - [x] Totalização no rodapé e exportação CSV/PDF.
- [x] **Relatórios — Expandir para 8 Tipos** (Ref: `MELHORIAS.md` - M-011)
  - `[x]` Endpoint "Esqueci minha Senha".
  - `[x]` Bloqueio por tentativas (5 falhas = 15 min bloqueado).
  - `[x]` Tela para o usuário alterar sua própria senha.

---

### Fase 10: Funcionalidades Novas (Diferencial Competitivo) - [CONCLUÍDA]
**Objetivo:** Funcionalidades que os concorrentes cobram caro e que vão diferenciar o COZINHA+ no mercado.

- [x] **Raio-X do Produto (Histórico Individual)** (Ref: `MELHORIAS.md` - M-016)
  - [x] Nova página `ProductDetail.tsx` com ficha completa de um produto.
  - [x] Saldo em cada filial/local, gráfico de variação 30 dias.
  - [x] Últimas movimentações, lotes ativos/vencidos, receitas vinculadas.
  - [x] Fornecedores que já entregaram e recebimentos recentes.
- [x] **Sugestão Automática de Compra** (Ref: `MELHORIAS.md` - M-017)
  - [x] Lista automática de produtos abaixo do mínimo.
  - [x] Qtd necessária para atingir o máximo + custo estimado.
  - [x] Fornecedor principal sugerido.
- [x] **Curva ABC Automática** (Ref: `MELHORIAS.md` - M-018)
  - [x] Classificação A/B/C baseada em valor de estoque (Qtd × Custo).
  - [x] Gráfico de Pareto visual.
- [x] **Cálculo de CMV (Custo de Mercadoria Vendida)** (Ref: `MELHORIAS.md` - M-019)
  - [x] Fórmula: Estoque Inicial + Compras - Estoque Final.
  - [x] Criação de `StockSnapshot` (foto do estoque em uma data).
  - [x] CMV% = (CMV / Faturamento) × 100.
- [x] **Alertas Clicáveis no Dashboard** (Ref: `MELHORIAS.md` - M-020)
  - [x] Clicar em alerta navega para a tela filtrada correspondente.
  - [x] Novos alertas: Recebimentos pendentes, Inventários pendentes, Rendimento baixo.
- [x] **Modo Escuro** (Ref: `MELHORIAS.md` - M-021)
  - [x] Toggle sol/lua no header. Salvar preferência no localStorage.
- [x] **Configurações da Empresa (Expandir)** (Ref: `MELHORIAS.md` - M-022)
  - [x] Upload de logo, dias de alerta configurável, regras de aprovação.

---

### Fase 11: Polimento e Experiência Premium
**Objetivo:** Garantir que a experiência de uso do sistema seja impecável e profissional.

- [x] **Paginação em Todas as Listagens** (Ref: `MELHORIAS.md` - M-023)
  - [x] Backend: `skip`/`take` no Prisma. Frontend: componente de paginação.
  - [x] Aplicar em: Produtos, Categorias, Locais, Fornecedores, Auditoria. (Demais módulos usarão a base criada).
- [x] **Toast Notifications (Feedback Visual)** (Ref: `MELHORIAS.md` - M-024)
  - [x] Substituir `alert()` por toasts elegantes (sucesso, erro, aviso).
- [x] **Loading States e Empty States** (Ref: `MELHORIAS.md` - M-025)
  - [x] Criar componente `LoadingSkeleton` (placeholder animado).
  - [x] Criar componente `EmptyState` com ilustração e call-to-action.
- [x] **Atualizar Documentação do Projeto** (Ref: `MELHORIAS.md` - M-026)
  - [x] Reescrever `database.md` com todas as tabelas e campos atuais.
  - [x] Atualizar `documentacao.md` com histórico de decisões e fases.

---

### Fase 6: Multiunidade e Ponto de Venda (Fase Final)
**Objetivo:** Adaptar o sistema para redes de um mesmo cliente e incluir a frente de caixa integrada. (Ref: `MVP.md` - Seção 46 e 49)

> ⚠️ **Pré-requisito:** Fases 7 e 8 devem estar concluídas antes de iniciar esta fase.

- [x] **Gestão Multiunidade (Filiais e Matriz)**
  - [x] Dashboard Consolidado (Soma de estoque e dinheiro de todas as filiais).
  - [x] Módulo de Transferência Inteligente de estoque entre filiais.
- [x] **Frente de Caixa (PDV Nativo)**
  - [x] Interface de vendas otimizada para Balcão/Tablet.
  - [x] Integração do fechamento de venda com a Ficha Técnica para baixa automática de estoque.
- [x] **Preparação para Aplicativo Nativo**
  - [x] Estrutura base para App (iOS/Android).

---

### Fase 12: Correções de Segurança Críticas (Pós-Auditoria)
**Objetivo:** Resolver as vulnerabilidades críticas identificadas no relatório `AUDITORIA_SEGURANCA.md` relacionadas a BOLA/IDOR e persistência indevida de acessos.

- [x] **Mitigação de IDOR Multi-Tenant (BOLA)**
  - [x] Validar `companyId: req.user!.companyId` em todos os endpoints de `update` e `delete` nos controllers (`product`, `category`, `location`, `receiving`).
- [x] **Isolamento de Filial para Administradores**
  - [x] Corrigir o bypass em `branchGuard.ts` e validar se o `branchId` forjado na requisição pertence de fato à `Company` do Admin.
- [x] **Invalidação de Refresh Token Inativos**
  - [x] Alterar o `authController.ts` na rota `refresh` para consultar o banco de dados e recusar a renovação caso o usuário esteja INATIVO ou deletado.
- [x] **Padronização da Validação de Entrada com Zod**
  - [x] Implementar e aplicar esquemas Zod nos controllers `category`, `location` e `receiving`, prevenindo Mass Assignment.

---

### Fase 13: Redesign Visual Completo (Referência Referência Premium)
**Objetivo:** Refazer toda a identidade visual do COZINHA+ para atingir nível de competição direta com o Referência Premium. Detalhes completos em `REDESIGN_VISUAL.md`.

- [x] **Nova Paleta de Cores (Laranja + Clean)**
  - [x] Substituir paleta azul Material Design 3 por paleta Branca + Laranja `#E8461C` no `index.css`.
  - [x] Atualizar tokens no `tailwind.config.js`.
  - [x] Adaptar Dark Mode para combinar com nova identidade laranja.
- [x] **Redesign da Sidebar**
  - [x] Fundo branco puro, largura 220px.
  - [x] Item ativo: pill shape com background `#FFE8DC` e texto `#E8461C`.
  - [x] Logo "COZINHA+" em laranja no topo.
  - [x] Agrupamento com dropdown/chevron para "Cadastros" e "Configurações".
- [x] **Redesign do Header / Topbar**
  - [x] Simplificar: Nome do restaurante + Badge "Unidade" (esquerda), Avatar + Nome + Cargo (direita).
  - [x] Remover subtítulo genérico.
  - [x] Busca e notificações mais discretos.
- [x] **Cards e KPIs Premium**
  - [x] Border-radius 16px, borda sutil, sombra mínima.
  - [x] Números de KPI em 48px bold (impactantes).
  - [x] Componente reutilizável `KpiCard.tsx`.
- [x] **Tabelas e Listas Modernas**
  - [x] Remover bordas de tabela tradicionais.
  - [x] Separadores horizontais sutis, padding generoso.
  - [x] Timeline vertical + numeração colorida (Produção).
- [x] **Botões e Interações**
  - [x] Primário: fundo laranja, texto branco, border-radius 12px.
  - [x] Outline: borda cinza, texto escuro.
  - [x] "Exportar relatório" com ícone de download.
- [x] **Novo Modelo de Etiqueta Profissional**
  - [x] Redesenhar componente `LabelPrint.tsx` seguindo modelo do Referência Premium.
  - [x] Incluir: Método de Conservação, Val. Original, Manipulação, Marca/Forn., SIF, Responsável, Dados do Estabelecimento, QR Code.
- [x] **Responsividade Mobile**
  - [x] Adaptar sidebar para mobile (hamburger menu).
  - [x] Cards empilhados verticalmente.
  - [x] Header compacto.

---

### Fase 14: Financeiro - Lançamento de Notas de Consumo
**Objetivo:** Criar módulo para lançamento de notas fiscais de consumo e despesas, vinculado a centros de custos.

- [x] Criar entidades no banco: `Invoice`, `CostCenter`, `InvoiceType`, `InvoiceOrigin`.
- [x] Implementar Backend (Rotas e Controllers CRUD).
- [x] Implementar Interface de Parametrização nas configurações da Empresa.
- [x] Tela de Lançamento de Nota (Filtros por Filial/Centro de Custo, Totais).
- [x] Cadastro rápido de Fornecedor (Modal integrado).
- [x] Ajustes de usabilidade: Fornecedores compartilhados, Autocomplete customizado, correção do menu lateral.

---

### Fase 15: Virada de Chave - Relatórios Financeiros e Operacionais [CONCLUÍDA]
**Objetivo:** Criar um módulo de relatórios analíticos, permitindo extrair visões gerais dos lançamentos financeiros (notas de consumo) por dia e por período.

- [x] Desenvolver tela "Relatórios".
- [x] Implementar filtros de período (Data Inicial e Final).
- [x] Implementar visualização "Multi-unidades" (consolidado da Empresa) x "Unidade específica".
- [x] Implementar filtro por Centro de Custo.
- [x] Exportação/Visão totalizadora para análise rápida.
- [x] (Opcional) Exportação para Excel / PDF. (Formato CSV entregue)

---

🚀 **Todas as Fases do MVP e Fase 14 foram concluídas com sucesso!**
